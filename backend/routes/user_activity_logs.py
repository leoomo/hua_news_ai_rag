from flask import Blueprint, request
from data.db import get_session
from data.user_management_models import UserActivityLog
from data.models import User
import json
from datetime import datetime, timedelta

user_activity_logs_bp = Blueprint('user_activity_logs', __name__)


@user_activity_logs_bp.get('/user-activity-logs')
def list_activity_logs():
    """获取活动日志列表"""
    db = get_session()
    try:
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        user_id = request.args.get('user_id', type=int)
        action = request.args.get('action')
        resource_type = request.args.get('resource_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # 构建查询
        query = db.query(UserActivityLog)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        if action:
            query = query.filter_by(action=action)
        if resource_type:
            query = query.filter_by(resource_type=resource_type)
        if start_date:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(UserActivityLog.created_at >= start_datetime)
        if end_date:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(UserActivityLog.created_at <= end_datetime)
        
        # 分页
        total = query.count()
        logs = query.order_by(UserActivityLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
        
        result = []
        for log in logs:
            # 获取用户信息
            user_info = None
            if log.user_id:
                user = db.query(User).get(log.user_id)
                if user:
                    user_info = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
            
            result.append({
                'id': log.id,
                'user_id': log.user_id,
                'user': user_info,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'details': log.details if isinstance(log.details, (dict, list)) else json.loads(log.details or '{}'),
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'created_at': log.created_at.isoformat() if log.created_at else None
            })
        
        return {'code': 0, 'data': {
            'items': result,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_activity_logs_bp.get('/users/<int:user_id>/activities')
def get_user_activities(user_id):
    """获取用户活动日志"""
    db = get_session()
    try:
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        action = request.args.get('action')
        resource_type = request.args.get('resource_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # 构建查询
        query = db.query(UserActivityLog).filter_by(user_id=user_id)
        
        if action:
            query = query.filter_by(action=action)
        if resource_type:
            query = query.filter_by(resource_type=resource_type)
        if start_date:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(UserActivityLog.created_at >= start_datetime)
        if end_date:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(UserActivityLog.created_at <= end_datetime)
        
        # 分页
        total = query.count()
        logs = query.order_by(UserActivityLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
        
        result = []
        for log in logs:
            result.append({
                'id': log.id,
                'user_id': log.user_id,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'details': log.details if isinstance(log.details, (dict, list)) else json.loads(log.details or '{}'),
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'created_at': log.created_at.isoformat() if log.created_at else None
            })
        
        return {'code': 0, 'data': {
            'items': result,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_activity_logs_bp.get('/user-activity-logs/stats')
def get_activity_stats():
    """获取活动统计"""
    db = get_session()
    try:
        # 获取查询参数
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # 构建查询
        query = db.query(UserActivityLog)
        
        if start_date:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(UserActivityLog.created_at >= start_datetime)
        if end_date:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(UserActivityLog.created_at <= end_datetime)
        
        # 总活动数
        total_activities = query.count()
        
        # 按操作类型统计
        activities_by_action = {}
        action_stats = db.query(
            UserActivityLog.action,
            db.func.count(UserActivityLog.id).label('count')
        ).group_by(UserActivityLog.action).all()
        
        for action, count in action_stats:
            activities_by_action[action] = count
        
        # 按用户统计
        activities_by_user = {}
        user_stats = db.query(
            UserActivityLog.user_id,
            db.func.count(UserActivityLog.id).label('count')
        ).group_by(UserActivityLog.user_id).all()
        
        for user_id, count in user_stats:
            if user_id:
                user = db.query(User).get(user_id)
                if user:
                    activities_by_user[user.username] = count
        
        # 每日活动统计（最近30天）
        daily_activities = []
        for i in range(30):
            date = datetime.now() - timedelta(days=i)
            start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            
            count = query.filter(
                UserActivityLog.created_at >= start_of_day,
                UserActivityLog.created_at < end_of_day
            ).count()
            
            daily_activities.append({
                'date': start_of_day.date().isoformat(),
                'count': count
            })
        
        daily_activities.reverse()  # 按时间正序排列
        
        return {'code': 0, 'data': {
            'total_activities': total_activities,
            'activities_by_action': activities_by_action,
            'activities_by_user': activities_by_user,
            'daily_activities': daily_activities
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_activity_logs_bp.post('/user-activity-logs')
def create_activity_log():
    """创建活动日志（内部使用）"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        log = UserActivityLog(
            user_id=data.get('user_id'),
            action=data['action'],
            resource_type=data.get('resource_type'),
            resource_id=data.get('resource_id'),
            details=json.dumps(data.get('details', {})),
            ip_address=data.get('ip_address'),
            user_agent=data.get('user_agent')
        )
        
        db.add(log)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': log.id,
            'user_id': log.user_id,
            'action': log.action,
            'resource_type': log.resource_type,
            'resource_id': log.resource_id,
            'details': json.loads(log.details or '{}'),
            'ip_address': log.ip_address,
            'user_agent': log.user_agent,
            'created_at': log.created_at.isoformat() if log.created_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()
