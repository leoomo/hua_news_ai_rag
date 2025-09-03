from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import sys
import calendar
from typing import Iterable

import feedparser
import hashlib
import logging

from data.db import get_session
from data.models import RssSource, NewsArticle, IngestLog
from .ingest_utils import clean_html_to_text, url_sha256, simhash, ensure_columns_for_dedup, ensure_columns_for_enrich, ensure_ingest_log_table
from ai.enrich import summarize_text, extract_keywords
from .fetcher import Fetcher

# 导入邮件模块
EMAIL_AVAILABLE = False
logger = logging.getLogger(__name__)

# 尝试相对导入（作为包运行时）与绝对导入（从项目根运行时）两种方式，提升鲁棒性
_enable_email = None
_import_errors: list[str] = []
try:
    from ..email_fly.email_config import ENABLE_EMAIL_MODULE as _ENABLE1  # type: ignore
    _enable_email = _ENABLE1
    import_mode = "relative"
except Exception as e1:
    _import_errors.append(f"relative import failed: {e1}")
    try:
        from backend.email_fly.email_config import ENABLE_EMAIL_MODULE as _ENABLE2  # type: ignore
        _enable_email = _ENABLE2
        import_mode = "absolute"
    except Exception as e2:
        _import_errors.append(f"absolute import failed: {e2}")
        # 最后尝试：将项目根目录加入 sys.path 后再次绝对导入
        try:
            project_root = Path(__file__).resolve().parents[2]
            if str(project_root) not in sys.path:
                sys.path.insert(0, str(project_root))
            from backend.email_fly.email_config import ENABLE_EMAIL_MODULE as _ENABLE3  # type: ignore
            _enable_email = _ENABLE3
            import_mode = "absolute+sys.path"
        except Exception as e3:
            _import_errors.append(f"absolute import with sys.path failed: {e3}")
            _enable_email = None
            import_mode = "none"

if _enable_email is None:
    logger.warning(
        "邮件模块导入失败，邮件通知功能将不可用: " + "; ".join(_import_errors)
    )
else:
    if _enable_email:
        # 导入发送函数（同样尝试两种方式）
        try:
            if import_mode == "relative":
                from ..email_fly.email_sender import send_rss_ingest_notification  # type: ignore
            else:
                # 为安全起见，再确保 project_root 在 sys.path
                try:
                    project_root = Path(__file__).resolve().parents[2]
                    if str(project_root) not in sys.path:
                        sys.path.insert(0, str(project_root))
                except Exception:
                    pass
                from backend.email_fly.email_sender import send_rss_ingest_notification  # type: ignore
            EMAIL_AVAILABLE = True
            logger.info(f"邮件模块已启用（{import_mode} import）")
        except Exception as e3:
            EMAIL_AVAILABLE = False
            logger.warning(f"邮件发送函数导入失败，邮件通知功能将不可用: {e3}")
    else:
        EMAIL_AVAILABLE = False
        logger.info("邮件模块已通过配置禁用")

logger = logging.getLogger(__name__)


def _hash_url(url: str) -> str:
    return url_sha256(url)


def parse_rss(source: RssSource) -> Iterable[dict]:
    # fetch via central fetcher to respect robots and rate limits
    fetcher = Fetcher()
    resp = fetcher.get(source.url)
    parsed = feedparser.parse(resp.content)
    
    print(f"Parsing RSS source: {source.name}, found {len(parsed.entries)} entries")
    
    for entry in parsed.entries:
        url = getattr(entry, "link", None) or getattr(entry, "id", None)
        if not url:
            continue
            
        title = getattr(entry, "title", "")
        
        # 尝试多种方式获取内容
        content_raw = ""
        if hasattr(entry, "summary") and entry.summary:
            content_raw = entry.summary
        elif hasattr(entry, "description") and entry.description:
            content_raw = entry.description
        elif hasattr(entry, "content") and entry.content:
            # 某些RSS源使用content字段
            if isinstance(entry.content, list) and len(entry.content) > 0:
                content_raw = entry.content[0].get("value", "")
            else:
                content_raw = str(entry.content)
        
        # 如果RSS中没有内容，尝试从URL获取
        if not content_raw.strip():
            print(f"Warning: No content found in RSS for {url}, title: {title}")
            # 这里可以添加网页抓取逻辑来获取完整内容
            content_raw = f"标题：{title}\n来源：{source.name}\n链接：{url}"
        
        content = clean_html_to_text(content_raw)
        
        # 如果清理后内容仍然为空，使用标题作为内容
        if not content.strip():
            content = f"标题：{title}\n来源：{source.name}\n链接：{url}"
        
        published = getattr(entry, "published_parsed", None)
        published_at = None
        if published:
            try:
                # Convert struct_time (assumed UTC from RSS) to timezone-aware UTC datetime
                ts = calendar.timegm(published)
                published_at = datetime.fromtimestamp(ts, tz=timezone.utc)
            except Exception:
                published_at = None
                
        print(f"Processing entry: {title[:50]}..., content length: {len(content)}")
        
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
        
        # 验证内容是否有效
        title = item.get("title", "").strip()
        content = item.get("content", "").strip()
        
        if not title or not content:
            print(f"Skipping item with empty title or content: title='{title}', content_length={len(content)}")
            skipped += 1
            continue
            
        if url:
            exists = db.query(NewsArticle).filter(NewsArticle.source_url == url).first()
            if exists:
                print(f"Skipping duplicate URL: {url}")
                skipped += 1
                continue

        sh = simhash(title + " " + content)

        summary = summarize_text(content, max_chars=200)
        keywords = ",".join(extract_keywords(title + " " + content, top_k=8))

        article = NewsArticle(
            title=title,
            content=content,
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

    # Record last fetch in UTC (timezone-aware)
    source.last_fetch = datetime.now(timezone.utc)
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

    # 发送邮件通知（如果启用了邮件功能且有新文章）
    if EMAIL_AVAILABLE and created > 0:
        try:
            # 获取新创建的文章信息用于邮件通知
            new_articles = []
            for item in iterator:
                if item.get("title") and item.get("content"):
                    new_articles.append({
                        "title": item.get("title"),
                        "summary": summarize_text(item.get("content"), max_chars=100),
                        "source": item.get("source_name"),
                        "url": item.get("source_url"),
                        "category": item.get("category"),
                        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    })
            
            # 发送邮件通知
            if new_articles:
                email_success = send_rss_ingest_notification(new_articles)
                if email_success:
                    logger.info(f"邮件通知发送成功，通知了 {len(new_articles)} 篇新文章")
                else:
                    logger.warning("邮件通知发送失败")
        except Exception as e:
            logger.error(f"发送邮件通知时出错: {str(e)}")
            # 邮件发送失败不影响采集流程
    
    return {"code": 0, "data": {"created": created, "skipped": skipped}}


