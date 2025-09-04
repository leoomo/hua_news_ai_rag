from flask import Blueprint, request
from data.db import get_session
from data.user_management_models import UserGroup, UserGroupMember
from data.models import User
import json

user_groups_bp = Blueprint('user_groups', __name__)


@user_groups_bp.get('/user-groups')
def list_user_groups():
    """获取用户组列表"""
    db = get_session()
    try:
        groups = db.query(UserGroup).all()
        result = []
        for group in groups:
            # 获取组成员数量
            member_count = db.query(UserGroupMember).filter_by(group_id=group.id).count()
            result.append({
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'created_by': group.created_by,
                'created_at': group.created_at.isoformat() if group.created_at else None,
                'updated_at': group.updated_at.isoformat() if group.updated_at else None,
                'member_count': member_count
            })
        return {'code': 0, 'data': result}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.get('/user-groups/<int:group_id>')
def get_user_group(group_id):
    """获取用户组详情"""
    db = get_session()
    try:
        group = db.query(UserGroup).get(group_id)
        if not group:
            return {'code': 404, 'msg': '用户组不存在'}, 404
        
        # 获取组成员
        members = db.query(UserGroupMember).filter_by(group_id=group_id).all()
        member_list = []
        for member in members:
            user = db.query(User).get(member.user_id)
            if user:
                member_list.append({
                    'id': member.id,
                    'user_id': member.user_id,
                    'username': user.username,
                    'email': user.email,
                    'role': member.role,
                    'joined_at': member.joined_at.isoformat() if member.joined_at else None
                })
        
        return {'code': 0, 'data': {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'created_by': group.created_by,
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None,
            'members': member_list
        }}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.post('/user-groups')
def create_user_group():
    """创建用户组"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        group = UserGroup(
            name=data['name'],
            description=data.get('description', ''),
            created_by=data.get('created_by')
        )
        
        db.add(group)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'created_by': group.created_by,
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.patch('/user-groups/<int:group_id>')
def update_user_group(group_id):
    """更新用户组"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        group = db.query(UserGroup).get(group_id)
        
        if not group:
            return {'code': 404, 'msg': '用户组不存在'}, 404
        
        group.name = data.get('name', group.name)
        group.description = data.get('description', group.description)
        
        db.commit()
        
        return {'code': 0, 'data': {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'created_by': group.created_by,
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.delete('/user-groups/<int:group_id>')
def delete_user_group(group_id):
    """删除用户组"""
    db = get_session()
    try:
        group = db.query(UserGroup).get(group_id)
        if not group:
            return {'code': 404, 'msg': '用户组不存在'}, 404
        
        # 删除所有组成员关系
        db.query(UserGroupMember).filter_by(group_id=group_id).delete()
        
        # 删除用户组
        db.delete(group)
        db.commit()
        
        return {'code': 0, 'data': {'id': group_id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.get('/user-groups/<int:group_id>/members')
def get_group_members(group_id):
    """获取组成员列表"""
    db = get_session()
    try:
        members = db.query(UserGroupMember).filter_by(group_id=group_id).all()
        result = []
        for member in members:
            user = db.query(User).get(member.user_id)
            if user:
                result.append({
                    'id': member.id,
                    'user_id': member.user_id,
                    'username': user.username,
                    'email': user.email,
                    'role': member.role,
                    'joined_at': member.joined_at.isoformat() if member.joined_at else None
                })
        return {'code': 0, 'data': result}
    except Exception as e:
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.post('/user-groups/<int:group_id>/members')
def add_group_member(group_id):
    """添加组成员"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        
        # 检查用户组是否存在
        group = db.query(UserGroup).get(group_id)
        if not group:
            return {'code': 404, 'msg': '用户组不存在'}, 404
        
        # 检查用户是否存在
        user = db.query(User).get(data['user_id'])
        if not user:
            return {'code': 404, 'msg': '用户不存在'}, 404
        
        # 检查是否已经是成员
        existing_member = db.query(UserGroupMember).filter_by(
            group_id=group_id, 
            user_id=data['user_id']
        ).first()
        if existing_member:
            return {'code': 400, 'msg': '用户已经是该组成员'}, 400
        
        member = UserGroupMember(
            group_id=group_id,
            user_id=data['user_id'],
            role=data.get('role', 'member')
        )
        
        db.add(member)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': member.id,
            'group_id': group_id,
            'user_id': data['user_id'],
            'role': member.role,
            'joined_at': member.joined_at.isoformat() if member.joined_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.delete('/user-groups/<int:group_id>/members/<int:user_id>')
def remove_group_member(group_id, user_id):
    """移除组成员"""
    db = get_session()
    try:
        member = db.query(UserGroupMember).filter_by(
            group_id=group_id, 
            user_id=user_id
        ).first()
        
        if not member:
            return {'code': 404, 'msg': '成员不存在'}, 404
        
        db.delete(member)
        db.commit()
        
        return {'code': 0, 'data': {'id': member.id}}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()


@user_groups_bp.patch('/user-groups/<int:group_id>/members/<int:user_id>')
def update_member_role(group_id, user_id):
    """更新成员角色"""
    db = get_session()
    try:
        data = request.get_json(force=True)
        member = db.query(UserGroupMember).filter_by(
            group_id=group_id, 
            user_id=user_id
        ).first()
        
        if not member:
            return {'code': 404, 'msg': '成员不存在'}, 404
        
        member.role = data.get('role', member.role)
        db.commit()
        
        return {'code': 0, 'data': {
            'id': member.id,
            'group_id': group_id,
            'user_id': user_id,
            'role': member.role,
            'joined_at': member.joined_at.isoformat() if member.joined_at else None
        }}
    except Exception as e:
        db.rollback()
        return {'code': 500, 'msg': str(e)}, 500
    finally:
        db.close()
