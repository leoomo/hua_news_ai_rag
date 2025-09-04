from flask import Blueprint, request
from data.db import get_session
from data.user_management_models import UserSession
from data.models import User
import json

user_sessions_bp = Blueprint('user_sessions', __name__)


@user_sessions_bp.get('/users/<int:user_id>/sessions')
def get_user_sessions(user_id):
    """获取用户会话列表"""
    db = get_session()
    try:
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        sessions = db.query(UserSession).filter_by(user_id=user_id).order_by(UserSession.created_at.desc()).all()
        result = []
        for session in sessions:
            result.append({
                'id': session.id,
                'user_id': session.user_id,
                'session_token': session.session_token,
                'refresh_token': session.refresh_token,
                'expires_at': session.expires_at.isoformat() if session.expires_at else None,
                'ip_address': session.ip_address,
                'user_agent': session.user_agent,
                'is_active': session.is_active,
                'created_at': session.created_at.isoformat() if session.created_at else None,
                'last_accessed_at': session.last_accessed_at.isoformat() if session.last_accessed_at else None
            })
        return {'code': 0, 'data': result}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_sessions_bp.delete('/user-sessions/<int:session_id>')
def revoke_session(session_id):
    """撤销会话"""
    db = get_session()
    try:
        session = db.query(UserSession).get(session_id)
        if not session:
            return {'code': 404, 'msg': '会话不存在'}, 404
        
        db.delete(session)
        db.commit()
        
        return {'code': 0, 'data': {'id': session_id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_sessions_bp.delete('/users/<int:user_id>/sessions')
def revoke_all_sessions(user_id):
    """撤销用户所有会话"""
    db = get_session()
    try:
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 删除所有会话
        deleted_count = db.query(UserSession).filter_by(user_id=user_id).delete()
        db.commit()
        
        return {'code': 0, 'data': {'deleted_count': deleted_count}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_sessions_bp.post('/user-sessions')
def create_session():
    """创建会话（内部使用）"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        session = UserSession(
            user_id=data['user_id'],
            session_token=data['session_token'],
            refresh_token=data.get('refresh_token'),
            expires_at=data.get('expires_at'),
            ip_address=data.get('ip_address'),
            user_agent=data.get('user_agent'),
            is_active=data.get('is_active', True)
        )
        
        db.add(session)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': session.id,
            'user_id': session.user_id,
            'session_token': session.session_token,
            'refresh_token': session.refresh_token,
            'expires_at': session.expires_at.isoformat() if session.expires_at else None,
            'ip_address': session.ip_address,
            'user_agent': session.user_agent,
            'is_active': session.is_active,
            'created_at': session.created_at.isoformat() if session.created_at else None,
            'last_accessed_at': session.last_accessed_at.isoformat() if session.last_accessed_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_sessions_bp.patch('/user-sessions/<int:session_id>')
def update_session(session_id):
    """更新会话"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        session = db.query(UserSession).get(session_id)
        
        if not session:
            return {'code': 404, 'msg': '会话不存在'}, 404
        
        session.is_active = data.get('is_active', session.is_active)
        session.last_accessed_at = data.get('last_accessed_at', session.last_accessed_at)
        
        db.commit()
        
        return {'code': 0, 'data': {
            'id': session.id,
            'user_id': session.user_id,
            'session_token': session.session_token,
            'refresh_token': session.refresh_token,
            'expires_at': session.expires_at.isoformat() if session.expires_at else None,
            'ip_address': session.ip_address,
            'user_agent': session.user_agent,
            'is_active': session.is_active,
            'created_at': session.created_at.isoformat() if session.created_at else None,
            'last_accessed_at': session.last_accessed_at.isoformat() if session.last_accessed_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()
