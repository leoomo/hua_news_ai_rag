from flask import Blueprint, request
from datetime import timezone
from data.db import get_session
from data.models import NewsArticle, IngestLog
from ai.vectorstore import build_index_from_recent_articles, search_index
from ai.qa import build_retrieval_qa
from sqlalchemy import func
from ai.enrich import extract_keywords
from flask import current_app
from datetime import datetime, timezone
from services import web_search_service, ai_summary_service, simple_web_search_service
from config import Settings

kb_bp = Blueprint('kb', __name__)


@kb_bp.get('/kb/items')
def kb_items():
    db = get_session()
    rows = db.query(NewsArticle).order_by(NewsArticle.created_at.desc()).all()
    def to_iso_utc(dt):
        if not dt:
            return None
        # If naive, assume UTC; else convert to UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        # Ensure trailing 'Z'
        iso = dt.isoformat()
        if not iso.endswith('Z'):
            iso = iso.replace('+00:00', 'Z')
        return iso

    return {'code': 0, 'data': [
        {
            'id': a.id,
            'title': a.title,
            'content': a.content,
            'source_name': a.source_name,
            'category': a.category,
            'created_at': to_iso_utc(a.created_at),
            'summary': getattr(a, 'summary', None),
        } for a in rows
    ]}


@kb_bp.post('/kb/items')
def kb_item_create():
    db = get_session()
    data = request.get_json(force=True) or {}
    title = (data.get('title') or '').strip()
    content = (data.get('content') or '').strip()
    if not title or not content:
        return {'code': 400, 'msg': 'title and content are required'}, 400
    a = NewsArticle(
        title=title,
        content=content,
        source_name=data.get('source_name'),
        source_url=data.get('source_url'),
        category=data.get('category'),
    )
    # 可选字段
    try:
        if data.get('summary') is not None:
            setattr(a, 'summary', data.get('summary'))
    except Exception:
        pass
    db.add(a)
    db.commit()
    return {'code': 0, 'data': {'id': a.id}}


@kb_bp.post('/kb/items/import')
def kb_items_import():
    """批量导入知识库条目。
    请求体 JSON: { items: [ {title, content, source_name?, source_url?, category?, published_at?} ] }
    返回: { code, data: { inserted, skipped, errors: [ {rowIndex, message} ] } }
    规则:
      - 必填: title, content
      - 去重: 若 source_url 存在且与现有记录重复则跳过
      - 时间: published_at 若存在，解析为 UTC; created_at 由数据库默认/当前时间提供
    """
    payload = request.get_json(silent=True) or {}
    items = payload.get('items') or []
    if not isinstance(items, list) or not items:
        return {'code': 400, 'msg': 'items is required (non-empty list)'}, 400

    db = get_session()
    inserted = 0
    skipped = 0
    errors: list[dict] = []

    def parse_dt(val):
        if not val:
            return None
        try:
            # 接受 ISO 字符串或常见格式
            if isinstance(val, (int, float)):
                return datetime.fromtimestamp(float(val), tz=timezone.utc)
            s = str(val).strip()
            dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
            # 统一转为 UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt
        except Exception:
            return None

    for idx, it in enumerate(items):
        title = (it.get('title') or '').strip()
        content = (it.get('content') or '').strip()
        if not title or not content:
            errors.append({'rowIndex': idx, 'message': 'title/content 不能为空'})
            skipped += 1
            continue

        source_url = (it.get('source_url') or None) or None
        if source_url:
            existed = db.query(NewsArticle).filter(NewsArticle.source_url == source_url).first()
            if existed:
                skipped += 1
                continue

        try:
            a = NewsArticle(
                title=title,
                content=content,
                source_name=it.get('source_name'),
                source_url=source_url,
                category=it.get('category'),
                published_at=parse_dt(it.get('published_at')),
            )
            db.add(a)
            inserted += 1
        except Exception as e:
            errors.append({'rowIndex': idx, 'message': f'插入失败: {str(e)}'})
            skipped += 1

    try:
        db.commit()
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        return {'code': 500, 'msg': f'db commit failed: {e}'}, 500

    return {'code': 0, 'data': {'inserted': inserted, 'skipped': skipped, 'errors': errors}}


@kb_bp.post('/search/semantic')
def search_semantic():
    data = request.get_json(force=True)
    query = (data.get('query', '') or '').strip()
    top_k = int(data.get('top_k') or 10)
    # 可配置的相似度阈值（默认 0.8）
    try:
        min_score = float(data.get('min_score') or 0.8)
    except Exception:
        min_score = 0.8
    index, id_map = build_index_from_recent_articles(limit_articles=200)
    if not index:
        # fallback to LIKE if embeddings missing
        db = get_session()
        q = f"%{query}%"
        rows = db.query(NewsArticle).filter((NewsArticle.title.like(q)) | (NewsArticle.content.like(q))).limit(top_k).all()
        data_like = [
            {
                'id': a.id,
                'title': a.title,
                'snippet': (a.content or '')[:160],
                'source_url': a.source_url,
                'score': 0.5,
            } for a in rows
        ]
        data_like = [r for r in data_like if r['score'] >= min_score]
        return {'code': 0, 'data': data_like[:top_k]}
    results = search_index(index, id_map, query, top_k=max(50, top_k * 5))
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
    # 语义分数基础上：
    # 1) 标题/内容包含关键词 → 强力加权
    # 2) 标题过短（≤2）且不包含关键词 → 降权，避免“是/的/了”等噪声
    # 3) 标题/内容与查询的中文字符交集为0 → 降权
    q_lower = query.lower()
    def boosted_score(article: NewsArticle) -> float:
        base = id_to_score.get(article.id, 0.0)
        base = zh_pref_score(article, base)
        title = (article.title or '')
        content = (article.content or '')
        t_lower = title.lower()
        c_lower = content.lower()
        boost = 0.0
        if q_lower and (q_lower in t_lower or q_lower in c_lower):
            boost += 0.3
        if len(title.strip()) <= 2 and q_lower not in t_lower:
            boost -= 0.3
        # 中文字符交集
        try:
            q_zh = set(re.findall(r"[\u4e00-\u9fff]", query))
            a_zh = set(re.findall(r"[\u4e00-\u9fff]", title + content))
            if q_zh and not (q_zh & a_zh):
                boost -= 0.2
        except Exception:
            pass
        return base + boost
    arts.sort(key=lambda a: boosted_score(a), reverse=True)
    # If query is Chinese-only, strictly filter to results containing Chinese.
    if is_zh_only:
        arts = [a for a in arts if re.search(r"[\u4e00-\u9fff]", (a.title or "") + (a.content or ""))]
    data_out = [
        {
            'id': a.id,
            'title': a.title,
            'snippet': (a.content or '')[:160],
            'source_url': a.source_url,
            'score': round(boosted_score(a), 4),
        } for a in arts
    ]
    # 过滤掉低于阈值的结果
    data_out = [r for r in data_out if r['score'] >= min_score]
    # secondary fallback: if语义检索为空，则执行LIKE
    if not data_out:
        q = f"%{query}%"
        base_q = db.query(NewsArticle).filter((NewsArticle.title.like(q)) | (NewsArticle.content.like(q)))
        if is_zh_only:
            base_q = base_q.filter((NewsArticle.title.op('REGEXP')(r"[\u4e00-\u9fff]")) | (NewsArticle.content.op('REGEXP')(r"[\u4e00-\u9fff]")))
        rows = base_q.limit(top_k).all()
        data_out = [
            {
                'id': a.id,
                'title': a.title,
                'snippet': (a.content or '')[:160],
                'source_url': a.source_url,
                'score': 0.4,
            } for a in rows
        ]
    # 对所有结果统一应用阈值过滤
    data_out = [r for r in data_out if r['score'] >= min_score]
    
    # 如果本地搜索无结果且启用了网络搜索兜底，则进行联网查询
    if not data_out and Settings().web_search_fallback:
        try:
            # 优先使用简单搜索服务（无需API密钥）
            web_results = simple_web_search_service.search_with_fallback(query, top_k=3)
            
            if web_results and web_results[0].get('source') != 'fallback':
                # 使用AI总结网络搜索结果
                enhanced_response = ai_summary_service.generate_enhanced_response(query, web_results)
                return {
                    'code': 0, 
                    'data': [], 
                    'web_search': enhanced_response,
                    'message': '本地知识库未找到相关内容，已为您联网查询并总结'
                }
            elif web_results:
                # 返回兜底结果
                return {
                    'code': 0, 
                    'data': [], 
                    'web_search': {
                        'summary': f'关于"{query}"的搜索结果暂时不可用，建议稍后再试或尝试其他关键词。',
                        'web_results': web_results,
                        'source': 'fallback',
                        'query': query
                    },
                    'message': '本地知识库未找到相关内容，网络搜索暂时不可用'
                }
        except Exception as e:
            print(f"网络搜索失败: {e}")
            # 网络搜索失败时，返回空结果
            pass
    
    return {'code': 0, 'data': data_out[:top_k]}


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


@kb_bp.get('/analytics/sources_trend')
def analytics_sources_trend():
    days = request.args.get('days', default=14, type=int)
    topk = request.args.get('topk', default=5, type=int)
    db = get_session()
    # 选出近days天内的来源TopK
    q_top = (
        db.query(NewsArticle.source_name, func.count(NewsArticle.id).label('c'))
        .filter(func.date(NewsArticle.created_at) >= func.date(func.datetime('now', f'-{days} day')))
        .group_by(NewsArticle.source_name)
        .order_by(func.count(NewsArticle.id).desc())
        .limit(topk)
        .all()
    )
    top_sources = [(s or '-') for s, _ in q_top]
    # 按天 × 来源 聚合
    q = (
        db.query(
            func.date(NewsArticle.created_at).label('d'),
            NewsArticle.source_name.label('s'),
            func.count(NewsArticle.id).label('c'),
        )
        .filter(func.date(NewsArticle.created_at) >= func.date(func.datetime('now', f'-{days} day')))
        .filter(NewsArticle.source_name.in_(top_sources))
        .group_by(func.date(NewsArticle.created_at), NewsArticle.source_name)
        .all()
    )
    # 生成连续日期
    from datetime import datetime, timedelta, timezone as _tz
    today = datetime.now(_tz.utc).date()
    day_list = [str(today - timedelta(days=i)) for i in range(days-1, -1, -1)]
    # 填充矩阵 {source: {date: count}}
    matrix: dict[str, dict[str, int]] = {s: {d: 0 for d in day_list} for s in top_sources}
    for d, s, c in q:
        s1 = s or '-'
        matrix.setdefault(s1, {d2:0 for d2 in day_list})
        matrix[s1][str(d)] = int(c)
    series = [
        { 'name': s, 'data': [matrix.get(s, {}).get(d, 0) for d in day_list] }
        for s in top_sources
    ]
    return {'code': 0, 'data': { 'dates': day_list, 'series': series }}


@kb_bp.get('/analytics/failures_top')
def analytics_failures_top():
    days = request.args.get('days', default=14, type=int)
    db = get_session()
    # 近days天失败原因Top
    q = (
        db.query(
            func.coalesce(IngestLog.error_message, 'unknown').label('err'),
            func.count(IngestLog.id).label('c')
        )
        .filter(IngestLog.status == 'failed')
        .filter(func.date(IngestLog.created_at) >= func.date(func.datetime('now', f'-{days} day')))
        .group_by(func.coalesce(IngestLog.error_message, 'unknown'))
        .order_by(func.count(IngestLog.id).desc())
        .limit(10)
        .all()
    )
    rows = [{ 'error': (e or 'unknown')[:80], 'count': int(c) } for e, c in q]
    return {'code': 0, 'data': rows}


@kb_bp.get('/analytics/hour_week_heat')
def analytics_hour_week_heat():
    days = request.args.get('days', default=14, type=int)
    db = get_session()
    # SQLite: %w 0-6 (周日=0), %H 00-23
    q = (
        db.query(
            func.strftime('%w', NewsArticle.created_at).label('w'),
            func.strftime('%H', NewsArticle.created_at).label('h'),
            func.count(NewsArticle.id).label('c'),
        )
        .filter(func.date(NewsArticle.created_at) >= func.date(func.datetime('now', f'-{days} day')))
        .group_by(func.strftime('%w', NewsArticle.created_at), func.strftime('%H', NewsArticle.created_at))
        .all()
    )
    # 构建 7x24 矩阵，周一=1放前，可根据需要调整
    heat = [[0 for _ in range(24)] for _ in range(7)]
    for w, h, c in q:
        wi = int(w)  # 0..6，0是周日
        hi = int(h)
        heat[wi][hi] = int(c)
    return {'code': 0, 'data': { 'matrix': heat, 'weekday0_is_sun': True }}


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
    # 最近7天入库量（补齐缺失日期）
    q7 = (
        db.query(func.date(NewsArticle.created_at).label('d'), func.count(NewsArticle.id))
        .group_by(func.date(NewsArticle.created_at))
        .order_by(func.date(NewsArticle.created_at).desc())
        .limit(14)
        .all()
    )
    q7_map = {str(d): int(c) for d, c in q7}
    from datetime import datetime, timedelta, timezone as _tz
    today_utc = datetime.now(_tz.utc).date()
    days = [today_utc - timedelta(days=i) for i in range(6, -1, -1)]
    last7 = [{'date': d.isoformat(), 'count': int(q7_map.get(d.isoformat(), 0))} for d in days]
    # 取最新8篇
    latest = db.query(NewsArticle).order_by(NewsArticle.id.desc()).limit(8).all()
    latest_out = [
        {
            'id': a.id,
            'title': a.title,
            'source_name': a.source_name,
            'source_url': a.source_url,
            'created_at': a.created_at.isoformat() if a.created_at else None,
        } for a in latest
    ]
    # 计算“知识库更新时间”：手动入库(articles.created_at 最大) 与 自动采集日志(ingest_logs.created_at 最大) 取较新者
    latest_manual = db.query(func.max(NewsArticle.created_at)).scalar()
    latest_auto = db.query(func.max(IngestLog.created_at)).scalar()

    def to_iso_utc(dt):
        if not dt:
            return None
        # 若为 naive 时间，视为 UTC；若有时区，则转 UTC
        if getattr(dt, 'tzinfo', None) is None:
            from datetime import timezone
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        iso = dt.isoformat()
        return iso if iso.endswith('Z') else iso.replace('+00:00', 'Z')

    latest_update_dt = None
    if latest_manual and latest_auto:
        latest_update_dt = max(latest_manual, latest_auto)
    else:
        latest_update_dt = latest_manual or latest_auto

    # 衍生指标：今日/昨日新增、分类与来源 Top3
    # 以 UTC 日期为准（前端展示时转本地时区）
    from datetime import datetime, timezone, timedelta
    today_utc = datetime.now(timezone.utc).date()
    yesterday_utc = today_utc - timedelta(days=1)

    def _count_on(d):
        return (
            db.query(func.count(NewsArticle.id))
            .filter(func.date(NewsArticle.created_at) == str(d))
            .scalar()
            or 0
        )

    today_count = int(_count_on(today_utc))
    yesterday_count = int(_count_on(yesterday_utc))

    # Top3 分类
    cat_rows = (
        db.query(NewsArticle.category, func.count(NewsArticle.id))
        .group_by(NewsArticle.category)
        .order_by(func.count(NewsArticle.id).desc())
        .limit(3)
        .all()
    )
    top_categories = [
        {"name": (c or "-"), "count": int(n)} for c, n in cat_rows if (c or "").strip() or n
    ]

    # Top3 来源
    src_rows = (
        db.query(NewsArticle.source_name, func.count(NewsArticle.id))
        .group_by(NewsArticle.source_name)
        .order_by(func.count(NewsArticle.id).desc())
        .limit(3)
        .all()
    )
    top_sources = [
        {"name": (s or "-"), "count": int(n)} for s, n in src_rows if (s or "").strip() or n
    ]

    from flask import make_response
    resp = make_response({'code': 0, 'data': {
        'total_articles': total_articles,
        'last7': last7,
        'latest': latest_out,
        'latest_update': to_iso_utc(latest_update_dt),
        'today_count': today_count,
        'yesterday_count': yesterday_count,
        'top_categories': top_categories,
        'top_sources': top_sources,
    }})
    # 禁止缓存，确保删除后立刻反映
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp


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


@kb_bp.post('/search/web')
def search_web():
    """专门的网络搜索接口"""
    data = request.get_json(force=True)
    query = (data.get('query', '') or '').strip()
    top_k = int(data.get('top_k') or 3)
    
    if not query:
        return {'code': 400, 'msg': 'query is required'}, 400
    
    if not Settings().enable_web_search:
        return {'code': 403, 'msg': 'web search is disabled'}, 403
    
    try:
        # 执行网络搜索（使用简单搜索服务）
        web_results = simple_web_search_service.search_with_fallback(query, top_k)
        
        if not web_results:
            return {'code': 0, 'data': [], 'message': '未找到相关网络搜索结果'}
        
        # 使用AI总结搜索结果
        enhanced_response = ai_summary_service.generate_enhanced_response(query, web_results)
        
        return {
            'code': 0,
            'data': enhanced_response,
            'message': '网络搜索完成'
        }
        
    except Exception as e:
        return {'code': 500, 'msg': f'网络搜索失败: {str(e)}'}, 500


@kb_bp.get('/kb/item')
def kb_item_detail():
    db = get_session()
    article_id = request.args.get('id', type=int)
    if not article_id:
        return {'code': 400, 'msg': 'id is required'}, 400
    a = db.query(NewsArticle).get(article_id)
    if not a:
        return {'code': 404, 'msg': 'Not Found'}, 404
    def to_iso_utc(dt):
        if not dt:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        iso = dt.isoformat()
        if not iso.endswith('Z'):
            iso = iso.replace('+00:00', 'Z')
        return iso

    return {'code': 0, 'data': {
        'id': a.id,
        'title': a.title,
        'content': a.content,
        'summary': getattr(a, 'summary', None),
        'keywords': getattr(a, 'keywords', None),
        'source_url': a.source_url,
        'source_name': a.source_name,
        'category': a.category,
        'published_at': to_iso_utc(a.published_at),
        'created_at': to_iso_utc(a.created_at),
    }}


@kb_bp.delete('/kb/items/<int:item_id>')
def kb_item_delete(item_id: int):
    db = get_session()
    a = db.query(NewsArticle).get(item_id)
    if not a:
        return {'code': 404, 'msg': 'Not Found'}, 404
    db.delete(a)
    db.commit()
    # 删除后返回最新总数，避免前端再次请求
    total_articles = db.query(func.count(NewsArticle.id)).scalar() or 0
    return {'code': 0, 'data': {'id': item_id, 'total': int(total_articles)}}


@kb_bp.post('/kb/items/batch-delete')
def kb_items_batch_delete():
    payload = request.get_json(silent=True) or {}
    ids = payload.get('ids') or []
    if not isinstance(ids, list) or not ids:
        return {'code': 400, 'msg': 'ids is required (non-empty list)'}, 400
    db = get_session()
    # 仅删除存在的记录
    q = db.query(NewsArticle).filter(NewsArticle.id.in_(ids))
    deleted = q.delete(synchronize_session=False)
    db.commit()
    total_articles = db.query(func.count(NewsArticle.id)).scalar() or 0
    return {'code': 0, 'data': {'deleted': int(deleted), 'total': int(total_articles)}}

