#!/usr/bin/env python3
"""
简单的邮件配置数据库迁移脚本
"""

import os
import sys
import json
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text
from backend.config import Settings

def create_email_config_table():
    """创建邮件配置表"""
    print("🚀 开始创建邮件配置表...")
    
    try:
        settings = Settings()
        engine = create_engine(settings.database_url)
        
        # 创建邮件配置表的SQL
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS email_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enable_email_module BOOLEAN DEFAULT 0,
            enable_email_notification BOOLEAN DEFAULT 1,
            recipient_emails TEXT DEFAULT '[]',
            sender_name VARCHAR(100) DEFAULT '华新AI知识库系统',
            sender_email VARCHAR(255) DEFAULT '',
            sender_password VARCHAR(255) DEFAULT '',
            email_provider VARCHAR(20) DEFAULT '163',
            custom_smtp_config TEXT DEFAULT '{}',
            max_articles_in_email INTEGER DEFAULT 10,
            email_template_language VARCHAR(10) DEFAULT 'zh_cn',
            email_format VARCHAR(20) DEFAULT 'markdown',
            email_send_timeout INTEGER DEFAULT 30,
            email_retry_count INTEGER DEFAULT 3,
            email_retry_delay INTEGER DEFAULT 5,
            created_at DATETIME DEFAULT (datetime('now')),
            updated_at DATETIME DEFAULT (datetime('now'))
        )
        """
        
        with engine.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()
        
        print("✅ 邮件配置表创建成功")
        
        # 检查是否已有数据
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM email_configs"))
            count = result.scalar()
            
            if count == 0:
                print("📝 插入默认邮件配置...")
                insert_default_config(conn)
            else:
                print(f"⚠️  表中已有 {count} 条配置记录")
        
        engine.dispose()
        
    except Exception as e:
        print(f"❌ 创建表失败: {str(e)}")
        raise

def insert_default_config(conn):
    """插入默认配置"""
    default_config = {
        'enable_email_module': 0,
        'enable_email_notification': 1,
        'recipient_emails': '[]',
        'sender_name': '华新AI知识库系统',
        'sender_email': '',
        'sender_password': '',
        'email_provider': '163',
        'custom_smtp_config': json.dumps({
            'smtp_host': 'smtp.your-server.com',
            'smtp_port': 587,
            'smtp_use_tls': True,
            'smtp_use_ssl': False
        }),
        'max_articles_in_email': 10,
        'email_template_language': 'zh_cn',
        'email_format': 'markdown',
        'email_send_timeout': 30,
        'email_retry_count': 3,
        'email_retry_delay': 5
    }
    
    insert_sql = """
    INSERT INTO email_configs (
        enable_email_module, enable_email_notification, recipient_emails,
        sender_name, sender_email, sender_password, email_provider,
        custom_smtp_config, max_articles_in_email, email_template_language,
        email_format, email_send_timeout, email_retry_count, email_retry_delay,
        created_at, updated_at
    ) VALUES (
        :enable_email_module, :enable_email_notification, :recipient_emails,
        :sender_name, :sender_email, :sender_password, :email_provider,
        :custom_smtp_config, :max_articles_in_email, :email_template_language,
        :email_format, :email_send_timeout, :email_retry_count, :email_retry_delay,
        datetime('now'), datetime('now')
    )
    """
    
    conn.execute(text(insert_sql), default_config)
    conn.commit()
    print("✅ 默认配置插入成功")

def verify_table():
    """验证表创建结果"""
    print("🔍 验证邮件配置表...")
    
    try:
        settings = Settings()
        engine = create_engine(settings.database_url)
        
        with engine.connect() as conn:
            # 检查表结构
            result = conn.execute(text("PRAGMA table_info(email_configs)"))
            columns = result.fetchall()
            
            print("📋 表结构:")
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
            
            # 检查数据
            result = conn.execute(text("SELECT * FROM email_configs LIMIT 1"))
            config = result.fetchone()
            
            if config:
                print("✅ 配置数据验证成功:")
                print(f"   - 邮件模块启用: {bool(config[1])}")
                print(f"   - 发件人名称: {config[4]}")
                print(f"   - 邮件服务商: {config[7]}")
            else:
                print("❌ 未找到配置数据")
        
        engine.dispose()
        
    except Exception as e:
        print(f"❌ 验证失败: {str(e)}")

if __name__ == '__main__':
    create_email_config_table()
    verify_table()
