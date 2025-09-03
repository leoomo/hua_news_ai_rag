from __future__ import annotations

from typing import List, Tuple

import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None  # type: ignore


class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        if SentenceTransformer is None:
            raise RuntimeError("sentence-transformers not installed. Install with: uv add .[embeddings]")
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str], batch_size: int = 64) -> np.ndarray:
        return np.array(self.model.encode(texts, batch_size=batch_size, show_progress_bar=False, normalize_embeddings=True))


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    if not text:
        return []
    tokens = list(text)
    chunks: List[str] = []
    i = 0
    while i < len(tokens):
        chunk = tokens[i:i+chunk_size]
        chunks.append("".join(chunk))
        if i + chunk_size >= len(tokens):
            break
        i += max(1, chunk_size - overlap)
    return chunks


