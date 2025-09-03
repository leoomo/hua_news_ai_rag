from flask import Blueprint, request
from data.db import get_session
from data.models import NewsArticle
from ai.vectorstore import build_index_from_recent_articles, search_index
from ai.qa import build_retrieval_qa
from sqlalchemy import func
from ai.enrich import extract_keywords
from flask import current_app

kb_bp = Blueprint('kb', __name__)


@kb_bp.get('/kb/items')
def kb_items():
    db = get_session()
    rows = db.query(NewsArticle).order_by(NewsArticle.created_at.desc()).limit(50).all()
    return {'code': 0, 'data': [
        {
            'id': a.id,
            'title': a.title,
            'content': a.content,
            'source_name': a.source_name,
            'category': a.category,
            'created_at': a.created_at.isoformat() if a.created_at else None,
            'summary': getattr(a, 'summary', None),
        } for a in rows
    ]}


@kb_bp.post('/search/semantic')
def search_semantic():
    data = request.get_json(force=True)
    query = data.get('query', '')
    index, id_map = build_index_from_recent_articles(limit_articles=200)
    if not index:
        # fallback to LIKE if embeddings missing
        db = get_session()
        q = f"%{query}%"
        rows = db.query(NewsArticle).filter((NewsArticle.title.like(q)) | (NewsArticle.content.like(q))).limit(10).all()
        return {'code': 0, 'data': [
            {
                'id': a.id,
                'title': a.title,
                'snippet': (a.content or '')[:160],
                'source_url': a.source_url,
                'score': 0.5,
            } for a in rows
        ]}
    results = search_index(index, id_map, query, top_k=10)
    db = get_session()
    id_to_score = {i: s for i, s in results}
    arts = db.query(NewsArticle).filter(NewsArticle.id.in_(id_to_score.keys())).all()
    arts.sort(key=lambda a: id_to_score.get(a.id, 0), reverse=True)
    # Simple language-aware rerank: if query seems Chinese, prefer Chinese content
    import re
    is_zh = bool(re.search(r"[\u4e00-\u9fff]", query or ""))
    is_zh_only = is_zh and not re.search(r"[A-Za-z]", query or "")
    def zh_pref_score(article: NewsArticle, score: float) -> float:
        if not is_zh:
            return score
        text = (article.title or "") + (article.content or "")
        return score + (0.05 if re.search(r"[\u4e00-\u9fff]", text) else -0.05)
    arts.sort(key=lambda a: zh_pref_score(a, id_to_score.get(a.id, 0.0)), reverse=True)
    # If query is Chinese-only, strictly filter to results containing Chinese.
    if is_zh_only:
        arts = [a for a in arts if re.search(r"[\u4e00-\u9fff]", (a.title or "") + (a.content or ""))]
    data_out = [
        {
            'id': a.id,
            'title': a.title,
            'snippet': (a.content or '')[:160],
            'source_url': a.source_url,
            'score': id_to_score.get(a.id, 0),
        } for a in arts
    ]
    # secondary fallback: if语义检索为空，则执行LIKE
    if not data_out:
        q = f"%{query}%"
        base_q = db.query(NewsArticle).filter((NewsArticle.title.like(q)) | (NewsArticle.content.like(q)))
        if is_zh_only:
            base_q = base_q.filter((NewsArticle.title.op('REGEXP')(r"[\u4e00-\u9fff]")) | (NewsArticle.content.op('REGEXP')(r"[\u4e00-\u9fff]")))
        rows = base_q.limit(10).all()
        data_out = [
            {
                'id': a.id,
                'title': a.title,
                'snippet': (a.content or '')[:160],
                'source_url': a.source_url,
                'score': 0.4,
            } for a in rows
        ]
    return {'code': 0, 'data': data_out}


@kb_bp.get('/analytics/keywords_top')
def analytics_keywords_top():
    limit = request.args.get('limit', default=10, type=int)
    db = get_session()
    counter: dict[str, int] = {}
    # 取最近200篇，优先使用已存keywords，否则临时提取
    rows = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(200).all()
    for a in rows:
        kw_str = getattr(a, 'keywords', None)
        kws = []
        if kw_str:
            kws = [k.strip() for k in (kw_str or '').split(',') if k.strip()]
        else:
            text = f"{a.title or ''} {a.content or ''}"
            kws = extract_keywords(text, top_k=8)
        for kw in kws:
            counter[kw] = counter.get(kw, 0) + 1
    top = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:limit]
    return {'code': 0, 'data': [{'keyword': k, 'count': c} for k, c in top]}


@kb_bp.get('/analytics/trend')
def analytics_trend():
    days = request.args.get('days', default=14, type=int)
    db = get_session()
    # group by date(created_at)
    q = (
        db.query(func.date(NewsArticle.created_at).label('d'), func.count(NewsArticle.id))
        .group_by(func.date(NewsArticle.created_at))
        .order_by(func.date(NewsArticle.created_at).desc())
        .limit(days)
        .all()
    )
    # reverse to ascending by date
    data = [{'date': str(d), 'count': int(c)} for d, c in reversed(q)]
    return {'code': 0, 'data': data}


@kb_bp.post('/scheduler/start')
def scheduler_start():
    sched = current_app.config.get('scheduler')
    if not sched:
        return {'code': 500, 'msg': 'scheduler unavailable'}, 500
    # ensure the ingest job exists
    from routes.rss import ingest_all_sources
    try:
        if not any(j.id == 'rss_ingest_all' for j in sched.get_jobs()):
            sched.add_job(ingest_all_sources, 'interval', minutes=30, id='rss_ingest_all', replace_existing=True)
        # trigger a one-off immediate run
        sched.add_job(ingest_all_sources, 'date', id='rss_ingest_once', replace_existing=True)
    except Exception:
        pass
    return {'code': 0}


@kb_bp.post('/scheduler/stop')
def scheduler_stop():
    sched = current_app.config.get('scheduler')
    if not sched:
        return {'code': 500, 'msg': 'scheduler unavailable'}, 500
    # remove the ingest job so it won't run automatically
    try:
        sched.remove_job('rss_ingest_all')
    except Exception:
        pass
    return {'code': 0}


@kb_bp.get('/scheduler/status')
def scheduler_status():
    sched = current_app.config.get('scheduler')
    if not sched:
        return {'code': 0, 'data': {'enabled': False, 'jobs': []}}
    try:
        jobs = sched.get_jobs()
        enabled = any(j.id == 'rss_ingest_all' for j in jobs)
        jobs_out = [
            {
                'id': j.id,
                'next_run_time': j.next_run_time.isoformat() if j.next_run_time else None,
                'trigger': str(j.trigger),
            }
            for j in jobs
        ]
        return {'code': 0, 'data': {'enabled': enabled, 'jobs': jobs_out}}
    except Exception:
        return {'code': 0, 'data': {'enabled': False, 'jobs': []}}


@kb_bp.get('/dashboard/summary')
def dashboard_summary():
    db = get_session()
    total_articles = db.query(func.count(NewsArticle.id)).scalar() or 0
    # 最近7天入库量
    q7 = (
        db.query(func.date(NewsArticle.created_at).label('d'), func.count(NewsArticle.id))
        .group_by(func.date(NewsArticle.created_at))
        .order_by(func.date(NewsArticle.created_at).desc())
        .limit(7)
        .all()
    )
    last7 = [{'date': str(d), 'count': int(c)} for d, c in reversed(q7)]
    # 取最新5篇
    latest = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(5).all()
    latest_out = [
        {
            'id': a.id,
            'title': a.title,
            'source_name': a.source_name,
            'created_at': a.created_at.isoformat() if a.created_at else None,
        } for a in latest
    ]
    return {'code': 0, 'data': {
        'total_articles': total_articles,
        'last7': last7,
        'latest': latest_out,
    }}


@kb_bp.post('/search/qa')
def search_qa():
    data = request.get_json(force=True)
    question = data.get('query', '')
    try:
        chain = build_retrieval_qa()
        result = chain.invoke({"query": question, "question": question})
        answer = result.get('result') or result
        sources = []
        for d in result.get('source_documents', []) or []:
            meta = getattr(d, 'metadata', {}) or {}
            sources.append({
                'title': meta.get('title'),
                'article_id': meta.get('article_id'),
                'chunk_index': meta.get('chunk_index'),
            })
        return {'code': 0, 'data': {'answer': answer, 'sources': sources}}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500


@kb_bp.get('/kb/item')
def kb_item_detail():
    db = get_session()
    article_id = request.args.get('id', type=int)
    if not article_id:
        return {'code': 400, 'msg': 'id is required'}, 400
    a = db.query(NewsArticle).get(article_id)
    if not a:
        return {'code': 404, 'msg': 'Not Found'}, 404
    return {'code': 0, 'data': {
        'id': a.id,
        'title': a.title,
        'content': a.content,
        'summary': getattr(a, 'summary', None),
        'keywords': getattr(a, 'keywords', None),
        'source_url': a.source_url,
        'source_name': a.source_name,
        'category': a.category,
        'published_at': a.published_at.isoformat() if a.published_at else None,
        'created_at': a.created_at.isoformat() if a.created_at else None,
    }}

