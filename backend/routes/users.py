from flask import Blueprint, request
from data.db import get_session
from data.models import User

users_bp = Blueprint('users', __name__)


@users_bp.get('/users')
def list_users():
    db = get_session()
    rows = db.query(User).all()
    return {'code': 0, 'data': [
        {'id': u.id, 'username': u.username, 'email': u.email, 'role': u.role}
        for u in rows
    ]}


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


