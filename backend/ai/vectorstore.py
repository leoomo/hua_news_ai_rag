from __future__ import annotations

from typing import List, Tuple

import numpy as np

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover
    faiss = None  # type: ignore

from data.db import get_session
from data.models import NewsArticle
from .embeddings import EmbeddingService, chunk_text
from config import Settings


def build_index_from_recent_articles(limit_articles: int = 200) -> Tuple[object | None, List[Tuple[int, int]]]:
    if faiss is None:
        return None, []
    settings = Settings()
    db = get_session()
    rows = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(limit_articles).all()

    texts: List[str] = []
    id_map: List[Tuple[int, int]] = []  # (article_id, chunk_idx)
    for a in rows:
        chunks = chunk_text(a.content or '', settings.chunk_size, settings.chunk_overlap)
        for idx, c in enumerate(chunks):
            texts.append(c)
            id_map.append((a.id, idx))
    if not texts:
        return None, []

    # Use multilingual embeddings for better cross-language matching
    service = EmbeddingService("paraphrase-multilingual-MiniLM-L12-v2")
    vecs = service.embed_texts(texts, batch_size=settings.embed_batch_size).astype('float32')
    d = vecs.shape[1]
    index = faiss.IndexFlatIP(d)
    index.add(vecs)
    return index, id_map

def search_index(index, id_map: List[Tuple[int, int]], query: str, top_k: int = 8) -> List[Tuple[int, float]]:
    if faiss is None or index is None or not id_map:
        return []
    # Use the same multilingual model for queries
    service = EmbeddingService("paraphrase-multilingual-MiniLM-L12-v2")
    qvec = service.embed_texts([query])[0].astype('float32')
    D, I = index.search(qvec.reshape(1, -1), top_k)
    results: List[Tuple[int, float]] = []
    for score, idx in zip(D[0].tolist(), I[0].tolist()):
        if idx == -1:
            continue
        art_id, _ = id_map[idx]
        results.append((art_id, float(score)))
    return results


