#!/usr/bin/env python3
"""
邮件配置数据库迁移脚本
将现有的 email_config.py 文件配置迁移到数据库
"""

import os
import sys
import json
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.data.db import init_db, get_session
from backend.data.models import EmailConfig, Base
from backend.config import Settings
from sqlalchemy import create_engine

def migrate_email_config():
    """迁移邮件配置到数据库"""
    print("🚀 开始迁移邮件配置到数据库...")
    
    try:
        # 初始化数据库
        settings = Settings()
        init_db(settings.database_url, settings)
        
        # 创建引擎和会话
        engine = create_engine(settings.database_url)
        
        # 创建表
        print("📋 创建邮件配置表...")
        Base.metadata.create_all(engine, checkfirst=True)
        
        # 检查是否已有配置
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=engine)
        session = Session()
        
        existing_config = session.query(EmailConfig).first()
        if existing_config:
            print("⚠️  数据库中已存在邮件配置，跳过迁移")
            session.close()
            return
        
        # 读取现有配置文件
        config_file_path = Path(__file__).parent.parent / 'email_fly' / 'email_config.py'
        if not config_file_path.exists():
            print("❌ 邮件配置文件不存在，创建默认配置")
            create_default_config(session)
        else:
            print("📖 读取现有邮件配置文件...")
            migrate_from_file(config_file_path, session)
        
        session.commit()
        session.close()
        print("✅ 邮件配置迁移完成！")
        
    except Exception as e:
        print(f"❌ 迁移失败: {str(e)}")
        raise

def migrate_from_file(config_file_path, session):
    """从配置文件迁移数据"""
    try:
        # 动态导入配置文件
        import importlib.util
        spec = importlib.util.spec_from_file_location("email_config", config_file_path)
        email_config = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(email_config)
        
        # 创建新的邮件配置记录
        new_config = EmailConfig(
            enable_email_module=getattr(email_config, 'ENABLE_EMAIL_MODULE', False),
            enable_email_notification=getattr(email_config, 'ENABLE_EMAIL_NOTIFICATION', True),
            recipient_emails=getattr(email_config, 'RECIPIENT_EMAILS', []),
            sender_name=getattr(email_config, 'SENDER_NAME', '华新AI知识库系统'),
            sender_email=getattr(email_config, 'SENDER_EMAIL', ''),
            sender_password=getattr(email_config, 'SENDER_PASSWORD', ''),
            email_provider=getattr(email_config, 'EMAIL_PROVIDER', '163'),
            custom_smtp_config=getattr(email_config, 'CUSTOM_SMTP_CONFIG', {
                'smtp_host': 'smtp.your-server.com',
                'smtp_port': 587,
                'smtp_use_tls': True,
                'smtp_use_ssl': False
            }),
            max_articles_in_email=getattr(email_config, 'MAX_ARTICLES_IN_EMAIL', 10),
            email_template_language=getattr(email_config, 'EMAIL_TEMPLATE_LANGUAGE', 'zh_cn'),
            email_format=getattr(email_config, 'EMAIL_FORMAT', 'markdown'),
            email_send_timeout=getattr(email_config, 'EMAIL_SEND_TIMEOUT', 30),
            email_retry_count=getattr(email_config, 'EMAIL_RETRY_COUNT', 3),
            email_retry_delay=getattr(email_config, 'EMAIL_RETRY_DELAY', 5),
        )
        
        session.add(new_config)
        print("✅ 从配置文件迁移数据成功")
        
    except Exception as e:
        print(f"⚠️  从配置文件迁移失败: {str(e)}，创建默认配置")
        create_default_config(session)

def create_default_config(session):
    """创建默认邮件配置"""
    default_config = EmailConfig(
        enable_email_module=False,
        enable_email_notification=True,
        recipient_emails=[],
        sender_name='华新AI知识库系统',
        sender_email='',
        sender_password='',
        email_provider='163',
        custom_smtp_config={
            'smtp_host': 'smtp.your-server.com',
            'smtp_port': 587,
            'smtp_use_tls': True,
            'smtp_use_ssl': False
        },
        max_articles_in_email=10,
        email_template_language='zh_cn',
        email_format='markdown',
        email_send_timeout=30,
        email_retry_count=3,
        email_retry_delay=5,
    )
    
    session.add(default_config)
    print("✅ 创建默认邮件配置成功")

def verify_migration():
    """验证迁移结果"""
    print("🔍 验证迁移结果...")
    
    try:
        settings = Settings()
        engine = create_engine(settings.database_url)
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=engine)
        session = Session()
        
        config = session.query(EmailConfig).first()
        if config:
            print("✅ 邮件配置验证成功:")
            print(f"   - 邮件模块启用: {config.enable_email_module}")
            print(f"   - 邮件通知启用: {config.enable_email_notification}")
            print(f"   - 发件人名称: {config.sender_name}")
            print(f"   - 邮件服务商: {config.email_provider}")
            print(f"   - 收件人数量: {len(config.recipient_emails)}")
        else:
            print("❌ 未找到邮件配置")
        
        session.close()
        
    except Exception as e:
        print(f"❌ 验证失败: {str(e)}")

if __name__ == '__main__':
    migrate_email_config()
    verify_migration()
