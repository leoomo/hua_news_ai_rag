from flask import Blueprint, request
import logging, traceback
from data.db import get_session
from data.models import RssSource, NewsArticle, IngestLog
from crawler.ingest_utils import ensure_columns_for_enrich
from ai.enrich import summarize_text, extract_keywords
from ai.embeddings import EmbeddingService, chunk_text
from config import Settings
from crawler.ingest import ingest_rss_source

rss_bp = Blueprint('rss', __name__)


@rss_bp.get('/rss')
def list_rss():
    db = get_session()
    rows = db.query(RssSource).all()
    def to_iso_utc(dt):
        if not dt:
            return None
        if dt.tzinfo is None:
            from datetime import timezone
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        iso = dt.isoformat()
        return iso if iso.endswith('Z') else iso.replace('+00:00', 'Z')

    return {'code': 0, 'data': [
        {
            'id': r.id,
            'name': r.name,
            'url': r.url,
            'category': r.category,
            'is_active': r.is_active,
            'last_fetch': to_iso_utc(getattr(r, 'last_fetch', None)),
        } for r in rows
    ]}


@rss_bp.post('/rss')
def create_rss():
    db = get_session()
    data = request.get_json(force=True)
    r = RssSource(
        name=data['name'],
        url=data['url'],
        category=data.get('category'),
        is_active=bool(data.get('is_active', True)),
    )
    db.add(r)
    db.commit()
    return {'code': 0, 'data': {'id': r.id}}


@rss_bp.patch('/rss')
def update_rss():
    db = get_session()
    data = request.get_json(force=True)
    r = db.query(RssSource).get(data['id'])
    if not r:
        return {'code': 404, 'msg': 'Not Found'}, 404
    r.name = data.get('name', r.name)
    r.url = data.get('url', r.url)
    r.category = data.get('category', r.category)
    r.is_active = bool(data.get('is_active', r.is_active))
    db.commit()
    return {'code': 0, 'data': {'id': r.id}}


@rss_bp.delete('/rss')
def delete_rss():
    db = get_session()
    rss_id = request.args.get('id', type=int)
    r = db.query(RssSource).get(rss_id)
    if not r:
        return {'code': 404, 'msg': 'Not Found'}, 404
    db.delete(r)
    db.commit()
    return {'code': 0, 'data': {'id': rss_id}}


# manual trigger ingest for a specific rss source
@rss_bp.post('/rss/ingest')
def trigger_ingest():
    source_id = request.args.get('id', type=int)
    if not source_id:
        return {'code': 400, 'msg': 'id is required'}, 400
    try:
        # 禁止对未启用的源进行采集
        db = get_session()
        try:
            src = db.query(RssSource).get(source_id)
            if not src:
                return {'code': 404, 'msg': 'Source not found'}, 404
            if not bool(src.is_active):
                return {'code': 400, 'msg': 'Source is inactive, cannot ingest'}, 400
        finally:
            try:
                db.close()
            except Exception:
                pass

        result = ingest_rss_source(source_id)
        status = 200 if result.get('code') == 0 else 500
        return result, status
    except Exception as e:
        logging.getLogger(__name__).error("Ingest endpoint error: %s\n%s", e, traceback.format_exc())
        return {'code': 500, 'msg': str(e)}, 500


@rss_bp.post('/rss/ingest_all')
def ingest_all():
    db = get_session()
    try:
        ids = [r.id for r in db.query(RssSource).filter(RssSource.is_active == True).all()]
    finally:
        try:
            db.close()
        except Exception:
            pass
    results = []
    total_created = 0
    total_skipped = 0
    email_summary = {
        "enabled": False,
        "sent": False,
        "recipients": [],
        "message": "批量采集完成"
    }
    
    for sid in ids:
        result = ingest_rss_source(sid)
        results.append({"id": sid, **result})
        
        # 汇总统计信息
        if result.get("code") == 0:
            data = result.get("data", {})
            total_created += data.get("created", 0)
            total_skipped += data.get("skipped", 0)
            
            # 汇总邮件状态（取最后一个有效的邮件状态）
            email_data = data.get("email", {})
            if email_data.get("enabled"):
                email_summary["enabled"] = True
                email_summary["recipients"] = email_data.get("recipients", [])
                if email_data.get("sent"):
                    email_summary["sent"] = True
                    email_summary["message"] = f"批量采集完成，邮件发送成功，已通知 {len(email_summary['recipients'])} 位收件人"
                else:
                    email_summary["message"] = f"批量采集完成，{email_data.get('message', '邮件发送失败')}"
    
    # 根据是否有新文章更新邮件状态
    if total_created == 0:
        email_summary["message"] = "批量采集完成，没有新文章，无需发送邮件"
    else:
        # 如果有新文章，检查是否有邮件发送成功
        if email_summary["enabled"] and email_summary["sent"]:
            email_summary["message"] = f"批量采集完成，邮件发送成功，已通知 {len(email_summary['recipients'])} 位收件人"
        elif email_summary["enabled"]:
            email_summary["message"] = f"批量采集完成，共新增 {total_created} 篇文章，但邮件发送失败"
        else:
            email_summary["message"] = f"批量采集完成，共新增 {total_created} 篇文章，但邮件模块未启用"
    
    return {
        "code": 0, 
        "data": {
            "results": results,
            "summary": {
                "total_created": total_created,
                "total_skipped": total_skipped,
                "email": email_summary
            }
        }
    }


# helper for background scheduler to call
def ingest_all_sources():
    db = get_session()
    ids = [r.id for r in db.query(RssSource).filter(RssSource.is_active == True).all()]
    for sid in ids:
        try:
            ingest_rss_source(sid)
        except Exception:
            pass


@rss_bp.get('/rss/status')
def rss_status():
    db = get_session()
    try:
        rows = db.query(IngestLog).order_by(IngestLog.created_at.desc()).limit(100).all()
    except Exception:
        # If table not ready yet, respond gracefully
        return {"code": 0, "data": []}
    return {"code": 0, "data": [
        {
            "id": r.id,
            "source_id": r.source_id,
            "url": r.url,
            "status": r.status,
            "created": r.created,
            "skipped": r.skipped,
            "error_message": r.error_message,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        } for r in rows
    ]}


@rss_bp.post('/rss/re_enrich')
def re_enrich():
    db = get_session()
    ensure_columns_for_enrich()
    # re-enrich latest N articles
    limit = request.args.get('limit', default=50, type=int)
    rows = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(limit).all()
    updated = 0
    for a in rows:
        summary = summarize_text(a.content or '', max_chars=200)
        keywords = ",".join(extract_keywords((a.title or '') + ' ' + (a.content or ''), top_k=8))
        a.summary = summary
        a.keywords = keywords
        updated += 1
    db.commit()
    return {"code": 0, "data": {"updated": updated}}


@rss_bp.post('/rss/embed_recent')
def embed_recent():
    db = get_session()
    limit = request.args.get('limit', default=30, type=int)
    rows = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(limit).all()
    settings = Settings()
    service = EmbeddingService("all-MiniLM-L6-v2")
    total_chunks = 0
    for a in rows:
        chunks = chunk_text(a.content or '', settings.chunk_size, settings.chunk_overlap)
        if not chunks:
            continue
        vecs = service.embed_texts(chunks, batch_size=settings.embed_batch_size)
        # store vectors out-of-band: here we only confirm embedding works
        total_chunks += len(chunks)
    return {"code": 0, "data": {"articles": len(rows), "chunks": total_chunks}}

