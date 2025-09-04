"""
用户管理功能扩展模型
基于现有 models.py 的增强设计
"""

from sqlalchemy import Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from .db import Base

if TYPE_CHECKING:
    from .models import User


class UserRole(Base):
    """用户角色权限表"""
    __tablename__ = 'user_roles'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    permissions: Mapped[Optional[str]] = mapped_column(Text)  # JSON格式的权限列表
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UserPreference(Base):
    """用户配置和偏好设置表"""
    __tablename__ = 'user_preferences'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    preference_key: Mapped[str] = mapped_column(String(100), nullable=False)
    preference_value: Mapped[Optional[str]] = mapped_column(Text)  # JSON格式
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关系
    user: Mapped['User'] = relationship('User', back_populates='preferences')


class UserActivityLog(Base):
    """用户活动日志表"""
    __tablename__ = 'user_activity_logs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[Optional[str]] = mapped_column(String(50))
    resource_id: Mapped[Optional[int]] = mapped_column(Integer)
    details: Mapped[Optional[str]] = mapped_column(Text)  # JSON格式
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关系
    user: Mapped[Optional['User']] = relationship('User', back_populates='activity_logs')


class UserSession(Base):
    """用户会话管理表"""
    __tablename__ = 'user_sessions'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    refresh_token: Mapped[Optional[str]] = mapped_column(String(255))
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_accessed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关系
    user: Mapped['User'] = relationship('User', back_populates='sessions')


class UserGroup(Base):
    """用户组表"""
    __tablename__ = 'user_groups'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关系
    creator: Mapped[Optional['User']] = relationship('User', foreign_keys=[created_by])
    members: Mapped[List['UserGroupMember']] = relationship('UserGroupMember', back_populates='group')


class UserGroupMember(Base):
    """用户组成员关系表"""
    __tablename__ = 'user_group_members'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey('user_groups.id', ondelete='CASCADE'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    role: Mapped[str] = mapped_column(String(50), default='member')
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # 关系
    group: Mapped['UserGroup'] = relationship('UserGroup', back_populates='members')
    user: Mapped['User'] = relationship('User', back_populates='group_memberships')





# 扩展现有 User 模型的关系
# 注意：这些关系需要在现有的 User 模型中添加

"""
在现有的 User 模型中添加以下关系：

class User(Base):
    # ... 现有字段 ...
    
    # 新增关系
    preferences: Mapped[List['UserPreference']] = relationship('UserPreference', back_populates='user')
    activity_logs: Mapped[List['UserActivityLog']] = relationship('UserActivityLog', back_populates='user')
    sessions: Mapped[List['UserSession']] = relationship('UserSession', back_populates='user')
    group_memberships: Mapped[List['UserGroupMember']] = relationship('UserGroupMember', back_populates='user')
    
    # 扩展字段（需要通过数据库迁移添加）
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    position: Mapped[Optional[str]] = mapped_column(String(100))
    timezone: Mapped[str] = mapped_column(String(50), default='UTC')
    language: Mapped[str] = mapped_column(String(10), default='zh-CN')
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime)
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
"""
