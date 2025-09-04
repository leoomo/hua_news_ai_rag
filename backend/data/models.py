from sqlalchemy import Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from .db import Base

if TYPE_CHECKING:
    from .user_management_models import UserPreference, UserActivityLog, UserSession, UserGroupMember


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default='user')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # 扩展字段（用户管理功能）
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
    
    # 关系（用户管理功能）- 暂时注释掉避免循环导入问题
    # preferences: Mapped[List['UserPreference']] = relationship('UserPreference', back_populates='user', lazy='select')
    # activity_logs: Mapped[List['UserActivityLog']] = relationship('UserActivityLog', back_populates='user', lazy='select')
    # sessions: Mapped[List['UserSession']] = relationship('UserSession', back_populates='user', lazy='select')
    # group_memberships: Mapped[List['UserGroupMember']] = relationship('UserGroupMember', back_populates='user', lazy='select')


class NewsArticle(Base):
    __tablename__ = 'news_articles'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(500))
    source_name: Mapped[str | None] = mapped_column(String(100))
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    category: Mapped[str | None] = mapped_column(String(50))
    tags: Mapped[str | None] = mapped_column(Text)
    importance_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    vector_id: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default='active')
    # 新增字段
    summary: Mapped[str | None] = mapped_column(Text)
    keywords: Mapped[str | None] = mapped_column(Text)


class RssSource(Base):
    __tablename__ = 'rss_sources'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_fetch: Mapped[datetime | None] = mapped_column(DateTime)
    fetch_interval: Mapped[int] = mapped_column(Integer, default=3600)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class QueryLog(Base):
    __tablename__ = 'query_logs'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'))
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    query_type: Mapped[str | None] = mapped_column(String(20))
    result_count: Mapped[int | None] = mapped_column(Integer)
    response_time: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IngestLog(Base):
    __tablename__ = 'ingest_logs'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int | None] = mapped_column(Integer)
    url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default='success')  # success | failed
    created: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class EmailConfig(Base):
    __tablename__ = 'email_configs'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 邮件功能开关
    enable_email_module: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_email_notification: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # 收件人配置
    recipient_emails: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # 发件人配置
    sender_name: Mapped[str] = mapped_column(String(100), default='华新AI知识库系统')
    sender_email: Mapped[str] = mapped_column(String(255), default='')
    sender_password: Mapped[str] = mapped_column(String(255), default='')
    
    # 邮件服务商配置
    email_provider: Mapped[str] = mapped_column(String(20), default='163')  # 163, qq, gmail, outlook, yahoo, sina, custom
    custom_smtp_config: Mapped[dict] = mapped_column(JSON, default=dict)  # 自定义SMTP配置
    
    # 邮件内容配置
    max_articles_in_email: Mapped[int] = mapped_column(Integer, default=10)
    email_template_language: Mapped[str] = mapped_column(String(10), default='zh_cn')
    email_format: Mapped[str] = mapped_column(String(20), default='markdown')
    
    # 发送配置
    email_send_timeout: Mapped[int] = mapped_column(Integer, default=30)
    email_retry_count: Mapped[int] = mapped_column(Integer, default=3)
    email_retry_delay: Mapped[int] = mapped_column(Integer, default=5)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

