from __future__ import annotations

import re
import html
import hashlib
from typing import Iterable

from sqlalchemy import text
from data.db import get_session, engine, Base


TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


def clean_html_to_text(content: str) -> str:
    if not content:
        return ""
    text_ = TAG_RE.sub(" ", content)
    text_ = html.unescape(text_)
    text_ = WHITESPACE_RE.sub(" ", text_).strip()
    return text_


def url_sha256(url: str) -> str:
    return hashlib.sha256((url or "").encode("utf-8")).hexdigest()


def _tokenize(text_: str) -> Iterable[str]:
    return re.findall(r"[\w\u4e00-\u9fff]+", (text_ or "").lower())


def simhash(text_: str, bits: int = 64) -> int:
    tokens = list(_tokenize(text_))
    if not tokens:
        return 0
    v = [0] * bits
    for token in tokens:
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        for i in range(bits):
            v[i] += 1 if (h >> i) & 1 else -1
    fingerprint = 0
    for i in range(bits):
        if v[i] >= 0:
            fingerprint |= (1 << i)
    return fingerprint


def hamming_distance(a: int, b: int) -> int:
    return (a ^ b).bit_count()


def _connect():
    # Prefer global engine; fallback to session bind
    if engine is not None:
        return engine.connect()
    db = get_session()
    return db.connection()


def ensure_columns_for_dedup():
    # Add url_hash and simhash columns to news_articles if missing
    with _connect() as conn:
        cols = [r[1] for r in conn.exec_driver_sql("PRAGMA table_info(news_articles)").fetchall()]
        if "url_hash" not in cols:
            conn.exec_driver_sql("ALTER TABLE news_articles ADD COLUMN url_hash VARCHAR(128)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_news_url_hash ON news_articles(url_hash)")
        if "simhash" not in cols:
            conn.exec_driver_sql("ALTER TABLE news_articles ADD COLUMN simhash VARCHAR(32)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_news_simhash ON news_articles(simhash)")
        try:
            conn.commit()
        except Exception:
            pass


def ensure_columns_for_enrich():
    # Add summary and keywords columns if missing
    with _connect() as conn:
        cols = [r[1] for r in conn.exec_driver_sql("PRAGMA table_info(news_articles)").fetchall()]
        if "summary" not in cols:
            conn.exec_driver_sql("ALTER TABLE news_articles ADD COLUMN summary TEXT")
        if "keywords" not in cols:
            conn.exec_driver_sql("ALTER TABLE news_articles ADD COLUMN keywords TEXT")
        try:
            conn.commit()
        except Exception:
            pass



def ensure_ingest_log_table():
    """Ensure ORM-declared tables (including ingest_logs) are created on the current DB bind."""
    if engine is not None:
        try:
            Base.metadata.create_all(engine)
        except Exception:
            pass
