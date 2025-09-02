from __future__ import annotations

from typing import List, Tuple

try:
    from langchain_community.vectorstores import FAISS as LCFAISS
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_community.llms import Ollama
    from langchain.chains import RetrievalQA
    from langchain.prompts import PromptTemplate
except Exception:  # pragma: no cover
    LCFAISS = None  # type: ignore

from .db import get_session
from .models import NewsArticle
from .embeddings import chunk_text
from .config import Settings


def build_langchain_retriever(limit_articles: int = 200):
    if LCFAISS is None:
        raise RuntimeError("LangChain not installed. Install with: uv sync -E langchain")
    settings = Settings()
    db = get_session()
    rows = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(limit_articles).all()
    docs: List[str] = []
    metadatas: List[dict] = []
    for a in rows:
        chunks = chunk_text(a.content or '', settings.chunk_size, settings.chunk_overlap)
        for idx, c in enumerate(chunks):
            if not c.strip():
                continue
            docs.append(c)
            metadatas.append({"article_id": a.id, "chunk_index": idx, "title": a.title})
    if not docs:
        raise RuntimeError("No documents available to build retriever")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vs = LCFAISS.from_texts(docs, embedding=embeddings, metadatas=metadatas)
    return vs.as_retriever(search_kwargs={"k": 6})


def build_retrieval_qa():
    retriever = build_langchain_retriever()
    llm = Ollama(model="qwen2.5:3b", temperature=0.2)
    prompt = PromptTemplate.from_template(
        "你是新闻助理。基于给定检索内容用中文简洁作答，引用关键信息。\n问题: {question}\n"
    )
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": prompt},
        return_source_documents=True,
    )
    return chain


