from flask import Blueprint, request
from data.db import get_session
from data.user_management_models import UserRole
import json

user_roles_bp = Blueprint('user_roles', __name__)


@user_roles_bp.get('/user-roles')
def list_user_roles():
    """获取角色列表"""
    db = get_session()
    try:
        roles = db.query(UserRole).all()
        result = []
        for role in roles:
            result.append({
                'id': role.id,
                'name': role.name,
                'display_name': role.display_name,
                'description': role.description,
                'permissions': role.permissions if isinstance(role.permissions, list) else json.loads(role.permissions or '[]'),
                'is_system_role': role.is_system_role,
                'created_at': role.created_at.isoformat() if role.created_at else None,
                'updated_at': role.updated_at.isoformat() if role.updated_at else None
            })
        return {'code': 0, 'data': result}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_roles_bp.get('/user-roles/<int:role_id>')
def get_user_role(role_id):
    """获取角色详情"""
    db = get_session()
    try:
        role = db.query(UserRole).get(role_id)
        if not role:
            return {'code': 404, 'msg': '角色不存在'}, 404
        
        return {'code': 0, 'data': {
            'id': role.id,
            'name': role.name,
            'display_name': role.display_name,
            'description': role.description,
            'permissions': role.permissions if isinstance(role.permissions, list) else json.loads(role.permissions or '[]'),
            'is_system_role': role.is_system_role,
            'created_at': role.created_at.isoformat() if role.created_at else None,
            'updated_at': role.updated_at.isoformat() if role.updated_at else None
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_roles_bp.post('/user-roles')
def create_user_role():
    """创建角色"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        # 检查角色名称是否已存在
        existing_role = db.query(UserRole).filter_by(name=data['name']).first()
        if existing_role:
            return {'code': 400, 'msg': '角色名称已存在'}, 400
        
        role = UserRole(
            name=data['name'],
            display_name=data['display_name'],
            description=data.get('description', ''),
            permissions=json.dumps(data.get('permissions', [])),
            is_system_role=data.get('is_system_role', False)
        )
        
        db.add(role)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': role.id,
            'name': role.name,
            'display_name': role.display_name,
            'description': role.description,
            'permissions': json.loads(role.permissions or '[]'),
            'is_system_role': role.is_system_role,
            'created_at': role.created_at.isoformat() if role.created_at else None,
            'updated_at': role.updated_at.isoformat() if role.updated_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_roles_bp.patch('/user-roles/<int:role_id>')
def update_user_role(role_id):
    """更新角色"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        role = db.query(UserRole).get(role_id)
        
        if not role:
            return {'code': 404, 'msg': '角色不存在'}, 404
        
        # 检查是否为系统角色
        if role.is_system_role and data.get('name') != role.name:
            return {'code': 400, 'msg': '系统角色不能修改名称'}, 400
        
        # 检查角色名称是否已存在（排除当前角色）
        if data.get('name') and data['name'] != role.name:
            existing_role = db.query(UserRole).filter_by(name=data['name']).first()
            if existing_role:
                return {'code': 400, 'msg': '角色名称已存在'}, 400
        
        role.name = data.get('name', role.name)
        role.display_name = data.get('display_name', role.display_name)
        role.description = data.get('description', role.description)
        role.permissions = json.dumps(data.get('permissions', json.loads(role.permissions or '[]')))
        
        db.commit()
        
        return {'code': 0, 'data': {
            'id': role.id,
            'name': role.name,
            'display_name': role.display_name,
            'description': role.description,
            'permissions': json.loads(role.permissions or '[]'),
            'is_system_role': role.is_system_role,
            'created_at': role.created_at.isoformat() if role.created_at else None,
            'updated_at': role.updated_at.isoformat() if role.updated_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_roles_bp.delete('/user-roles/<int:role_id>')
def delete_user_role(role_id):
    """删除角色"""
    db = get_session()
    try:
        role = db.query(UserRole).get(role_id)
        if not role:
            return {'code': 404, 'msg': '角色不存在'}, 404
        
        # 检查是否为系统角色
        if role.is_system_role:
            return {'code': 400, 'msg': '系统角色不能删除'}, 400
        
        # 检查是否有用户使用该角色
        from data.models import User
        users_with_role = db.query(User).filter_by(role=role.name).count()
        if users_with_role > 0:
            return {'code': 400, 'msg': f'有 {users_with_role} 个用户正在使用该角色，无法删除'}, 400
        
        db.delete(role)
        db.commit()
        
        return {'code': 0, 'data': {'id': role_id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()
