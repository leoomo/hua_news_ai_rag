from flask import Blueprint, request
from passlib.hash import bcrypt
import jwt
from datetime import datetime, timedelta
from ..db import get_session
from ..models import User
from flask import current_app as app

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/login')
def login():
    data = request.get_json(force=True) or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return {'code': 400, 'msg': 'missing username or password'}, 400

    db = get_session()
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {'code': 401, 'msg': 'invalid credentials'}, 401

    # For seed data where password is plaintext, allow fallback
    valid = (user.password_hash == password) or bcrypt.verify(password, user.password_hash)
    if not valid:
        return {'code': 401, 'msg': 'invalid credentials'}, 401

    user.last_login = datetime.utcnow()
    db.commit()

    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return {'code': 0, 'token': token}


