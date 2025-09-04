from flask import Blueprint, request
from data.db import get_session
from data.models import User
from data.user_management_models import UserRole, UserActivityLog
from sqlalchemy import func
import json

users_bp = Blueprint('users', __name__)


@users_bp.get('/users')
def list_users():
    """获取用户列表（支持分页和筛选）"""
    db = get_session()
    try:
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search')
        role = request.args.get('role')
        department = request.args.get('department')
        is_active = request.args.get('is_active', type=bool)
        
        # 构建查询
        query = db.query(User)
        
        if search:
            query = query.filter(
                (User.username.contains(search)) | 
                (User.email.contains(search))
            )
        if role:
            query = query.filter_by(role=role)
        if department:
            query = query.filter_by(department=department)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        # 分页
        total = query.count()
        users = query.offset((page - 1) * limit).limit(limit).all()
        
        result = []
        for user in users:
            result.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'full_name': getattr(user, 'full_name', None),
                'phone': getattr(user, 'phone', None),
                'department': getattr(user, 'department', None),
                'position': getattr(user, 'position', None),
                'timezone': getattr(user, 'timezone', None),
                'language': getattr(user, 'language', None),
                'email_verified': getattr(user, 'email_verified', False),
                'phone_verified': getattr(user, 'phone_verified', False),
                'two_factor_enabled': getattr(user, 'two_factor_enabled', False),
                'failed_login_attempts': getattr(user, 'failed_login_attempts', 0),
                'locked_until': getattr(user, 'locked_until', None),
                'password_changed_at': getattr(user, 'password_changed_at', None),
                'last_activity_at': getattr(user, 'last_activity_at', None),
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'last_login': getattr(user, 'last_login', None),
                'is_active': user.is_active
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


@users_bp.post('/users')
def create_user():
    db = get_session()
    data = request.get_json(force=True)
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=data.get('password', 'user123'),
        role=data.get('role', 'user'),
        is_active=True,
    )
    db.add(user)
    db.commit()
    return {'code': 0, 'data': {'id': user.id}}


@users_bp.patch('/users')
def update_user():
    db = get_session()
    data = request.get_json(force=True)
    u = db.query(User).get(data['id'])
    if not u:
        return {'code': 404, 'msg': 'Not Found'}, 404
    u.username = data.get('username', u.username)
    u.email = data.get('email', u.email)
    u.role = data.get('role', u.role)
    db.commit()
    return {'code': 0, 'data': {'id': u.id}}


@users_bp.delete('/users')
def delete_user():
    db = get_session()
    user_id = request.args.get('id', type=int)
    u = db.query(User).get(user_id)
    if not u:
        return {'code': 404, 'msg': 'Not Found'}, 404
    db.delete(u)
    db.commit()
    return {'code': 0, 'data': {'id': user_id}}


@users_bp.get('/users/stats')
def get_user_stats():
    """获取用户统计信息"""
    db = get_session()
    try:
        # 总用户数
        total_users = db.query(User).count()
        
        # 活跃用户数
        active_users = db.query(User).filter_by(is_active=True).count()
        
        # 按角色统计
        users_by_role = {}
        role_stats = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        for role, count in role_stats:
            users_by_role[role] = count
        
        # 按部门统计
        users_by_department = {}
        department_stats = db.query(
            User.department,
            func.count(User.id).label('count')
        ).filter(User.department.isnot(None)).group_by(User.department).all()
        
        for department, count in department_stats:
            users_by_department[department or '未设置'] = count
        
        # 最近活动数（最近24小时）
        from datetime import datetime, timedelta
        try:
            recent_activity = db.query(UserActivityLog).filter(
                UserActivityLog.created_at >= datetime.now() - timedelta(hours=24)
            ).count()
        except Exception as e:
            print(f"Error querying activity logs: {e}")
            recent_activity = 0
        
        # 登录失败数
        failed_logins = db.query(User).filter(
            User.failed_login_attempts > 0
        ).count()
        
        return {'code': 0, 'data': {
            'total_users': total_users,
            'active_users': active_users,
            'users_by_role': users_by_role,
            'users_by_department': users_by_department,
            'recent_activity': recent_activity,
            'failed_logins': failed_logins
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@users_bp.get('/users/<int:user_id>')
def get_user(user_id):
    """获取用户详情"""
    db = get_session()
    try:
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        return {'code': 0, 'data': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'full_name': getattr(user, 'full_name', None),
            'phone': getattr(user, 'phone', None),
            'department': getattr(user, 'department', None),
            'position': getattr(user, 'position', None),
            'timezone': getattr(user, 'timezone', None),
            'language': getattr(user, 'language', None),
            'email_verified': getattr(user, 'email_verified', False),
            'phone_verified': getattr(user, 'phone_verified', False),
            'two_factor_enabled': getattr(user, 'two_factor_enabled', False),
            'failed_login_attempts': getattr(user, 'failed_login_attempts', 0),
            'locked_until': getattr(user, 'locked_until', None),
            'password_changed_at': getattr(user, 'password_changed_at', None),
            'last_activity_at': getattr(user, 'last_activity_at', None),
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
            'last_login': getattr(user, 'last_login', None),
            'is_active': user.is_active
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@users_bp.patch('/users/<int:user_id>')
def update_user_by_id(user_id):
    """根据ID更新用户"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        user = db.query(User).get(user_id)
        
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 更新用户信息
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        user.is_active = data.get('is_active', user.is_active)
        
        # 更新扩展字段
        if 'full_name' in data:
            setattr(user, 'full_name', data['full_name'])
        if 'phone' in data:
            setattr(user, 'phone', data['phone'])
        if 'department' in data:
            setattr(user, 'department', data['department'])
        if 'position' in data:
            setattr(user, 'position', data['position'])
        if 'timezone' in data:
            setattr(user, 'timezone', data['timezone'])
        if 'language' in data:
            setattr(user, 'language', data['language'])
        
        db.commit()
        
        return {'code': 0, 'data': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@users_bp.delete('/users/<int:user_id>')
def delete_user_by_id(user_id):
    """根据ID删除用户"""
    db = get_session()
    try:
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        db.delete(user)
        db.commit()
        
        return {'code': 0, 'data': {'id': user_id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@users_bp.patch('/users/<int:user_id>/status')
def toggle_user_status(user_id):
    """切换用户状态"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        user = db.query(User).get(user_id)
        
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        user.is_active = data.get('is_active', not user.is_active)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': user.id,
            'is_active': user.is_active
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@users_bp.patch('/users/<int:user_id>/password')
def reset_user_password(user_id):
    """重置用户密码"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        user = db.query(User).get(user_id)
        
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 这里应该对密码进行哈希处理
        # 暂时直接设置，实际应用中需要使用安全的密码哈希
        user.password_hash = data.get('password', 'user123')
        
        # 更新密码修改时间
        from datetime import datetime
        setattr(user, 'password_changed_at', datetime.now())
        
        db.commit()
        
        return {'code': 0, 'data': {'id': user.id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


