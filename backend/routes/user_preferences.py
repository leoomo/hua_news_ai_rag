from flask import Blueprint, request
from data.db import get_session
from data.user_management_models import UserPreference
from data.models import User
import json

user_preferences_bp = Blueprint('user_preferences', __name__)


@user_preferences_bp.get('/users/<int:user_id>/preferences')
def get_user_preferences(user_id):
    """获取用户偏好设置"""
    db = get_session()
    try:
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        preferences = db.query(UserPreference).filter_by(user_id=user_id).all()
        result = []
        for pref in preferences:
            result.append({
                'id': pref.id,
                'user_id': pref.user_id,
                'preference_key': pref.preference_key,
                'preference_value': pref.preference_value if isinstance(pref.preference_value, (dict, list)) else json.loads(pref.preference_value or '{}'),
                'created_at': pref.created_at.isoformat() if pref.created_at else None,
                'updated_at': pref.updated_at.isoformat() if pref.updated_at else None
            })
        return {'code': 0, 'data': result}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_preferences_bp.post('/users/<int:user_id>/preferences')
def set_user_preference(user_id):
    """设置用户偏好"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 检查偏好是否已存在
        existing_pref = db.query(UserPreference).filter_by(
            user_id=user_id, 
            preference_key=data['preference_key']
        ).first()
        
        if existing_pref:
            # 更新现有偏好
            existing_pref.preference_value = json.dumps(data['preference_value'])
            db.commit()
            preference = existing_pref
        else:
            # 创建新偏好
            preference = UserPreference(
                user_id=user_id,
                preference_key=data['preference_key'],
                preference_value=json.dumps(data['preference_value'])
            )
            db.add(preference)
            db.commit()
        
        return {'code': 0, 'data': {
            'id': preference.id,
            'user_id': preference.user_id,
            'preference_key': preference.preference_key,
            'preference_value': json.loads(preference.preference_value or '{}'),
            'created_at': preference.created_at.isoformat() if preference.created_at else None,
            'updated_at': preference.updated_at.isoformat() if preference.updated_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_preferences_bp.patch('/users/<int:user_id>/preferences/<string:preference_key>')
def update_user_preference(user_id, preference_key):
    """更新用户偏好"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 查找偏好设置
        preference = db.query(UserPreference).filter_by(
            user_id=user_id, 
            preference_key=preference_key
        ).first()
        
        if not preference:
            return {'code': 404, 'msg': '偏好设置不存在'}, 404
        
        preference.preference_value = json.dumps(data.get('preference_value', json.loads(preference.preference_value or '{}')))
        db.commit()
        
        return {'code': 0, 'data': {
            'id': preference.id,
            'user_id': preference.user_id,
            'preference_key': preference.preference_key,
            'preference_value': json.loads(preference.preference_value or '{}'),
            'created_at': preference.created_at.isoformat() if preference.created_at else None,
            'updated_at': preference.updated_at.isoformat() if preference.updated_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_preferences_bp.delete('/users/<int:user_id>/preferences/<string:preference_key>')
def delete_user_preference(user_id, preference_key):
    """删除用户偏好"""
    db = get_session()
    try:
        # 检查用户是否存在
        user = db.query(User).get(user_id)
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 查找偏好设置
        preference = db.query(UserPreference).filter_by(
            user_id=user_id, 
            preference_key=preference_key
        ).first()
        
        if not preference:
            return {'code': 404, 'msg': '偏好设置不存在'}, 404
        
        db.delete(preference)
        db.commit()
        
        return {'code': 0, 'data': {'id': preference.id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()
