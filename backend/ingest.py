from __future__ import annotations

from datetime import datetime
from typing import Iterable

import feedparser
import hashlib
import logging

from .db import get_session
from .models import RssSource, NewsArticle, IngestLog
from .ingest_utils import clean_html_to_text, url_sha256, simhash, ensure_columns_for_dedup, ensure_columns_for_enrich, ensure_ingest_log_table
from .enrich import summarize_text, extract_keywords
from .fetcher import Fetcher

logger = logging.getLogger(__name__)


def _hash_url(url: str) -> str:
    return url_sha256(url)


def parse_rss(source: RssSource) -> Iterable[dict]:
    # fetch via central fetcher to respect robots and rate limits
    fetcher = Fetcher()
    resp = fetcher.get(source.url)
    parsed = feedparser.parse(resp.content)
    for entry in parsed.entries:
        url = getattr(entry, "link", None) or getattr(entry, "id", None)
        if not url:
            continue
        title = getattr(entry, "title", "")
        content_raw = getattr(entry, "summary", "")
        content = clean_html_to_text(content_raw)
        published = getattr(entry, "published_parsed", None)
        published_at = None
        if published:
            try:
                published_at = datetime(*published[:6])
            except Exception:
                published_at = None
        yield {
            "title": title,
            "content": content,
            "source_url": url,
            "source_name": source.name,
            "published_at": published_at,
            "category": source.category,
        }


def ingest_rss_source(source_id: int) -> dict:
    # open session
    try:
        db = get_session()
    except Exception as e:
        return {"code": 500, "msg": f"DB session error: {e}"}
    # ensure required tables/columns exist (idempotent)
    try:
        ensure_ingest_log_table()
        ensure_columns_for_dedup()
        ensure_columns_for_enrich()
    except Exception:
        pass
    # fetch source with one retry on closed connection
    try:
        source = db.get(RssSource, source_id)
    except Exception as e:
        if "Connection is closed" in str(e):
            try:
                db.close()
            except Exception:
                pass
            db = get_session()
            try:
                source = db.get(RssSource, source_id)
            except Exception as e2:
                try:
                    db.close()
                except Exception:
                    pass
                return {"code": 500, "msg": f"Query source failed: {e2}"}
        else:
            try:
                db.close()
            except Exception:
                pass
            return {"code": 500, "msg": f"Query source failed: {e}"}
    if not source or not source.is_active:
        return {"code": 404, "msg": "Source not found or inactive"}

    created = 0
    skipped = 0

    try:
        iterator = parse_rss(source)
    except Exception as e:
        try:
            db.add(IngestLog(source_id=source.id, url=source.url, status='failed', error_message=str(e)))
            db.commit()
        except Exception:
            try:
                db.rollback()
            except Exception:
                pass
        return {"code": 500, "msg": f"Fetch/parse failed: {e}"}

    for item in iterator:
        url = item.get("source_url")
        url_hash = _hash_url(url) if url else None
        if url:
            exists = db.query(NewsArticle).filter(NewsArticle.source_url == url).first()
            if exists:
                skipped += 1
                continue

        sh = simhash((item.get("title") or "") + " " + (item.get("content") or ""))

        summary = summarize_text((item.get("content") or ""), max_chars=200)
        keywords = ",".join(extract_keywords((item.get("title") or "") + " " + (item.get("content") or ""), top_k=8))

        article = NewsArticle(
            title=item["title"] or "",
            content=item["content"] or "",
            source_url=url,
            source_name=item.get("source_name"),
            published_at=item.get("published_at"),
            category=item.get("category"),
            tags=None,
        )
        # best-effort assign dedup fields if model has them
        try:
            setattr(article, "url_hash", url_hash)
        except Exception:
            pass
        try:
            setattr(article, "simhash", format(sh, 'x'))
        except Exception:
            pass
        try:
            setattr(article, "summary", summary)
            setattr(article, "keywords", keywords)
        except Exception:
            pass
        db.add(article)
        created += 1

    source.last_fetch = datetime.utcnow()
    try:
        db.add(IngestLog(source_id=source.id, url=source.url, status='success', created=created, skipped=skipped))
        db.commit()
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        return {"code": 500, "msg": f"Commit failed: {e}"}
    finally:
        try:
            db.close()
        except Exception:
            pass

    return {"code": 0, "data": {"created": created, "skipped": skipped}}


