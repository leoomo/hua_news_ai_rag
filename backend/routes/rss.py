from flask import Blueprint, request
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
    return {'code': 0, 'data': [
        {
            'id': r.id,
            'name': r.name,
            'url': r.url,
            'category': r.category,
            'is_active': r.is_active,
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
        result = ingest_rss_source(source_id)
        status = 200 if result.get('code') == 0 else 500
        return result, status
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500


@rss_bp.post('/rss/ingest_all')
def ingest_all():
    db = get_session()
    ids = [r.id for r in db.query(RssSource).filter(RssSource.is_active == True).all()]
    results = []
    for sid in ids:
        results.append({"id": sid, **ingest_rss_source(sid)})
    return {"code": 0, "data": results}


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

