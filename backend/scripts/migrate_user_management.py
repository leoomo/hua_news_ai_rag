#!/usr/bin/env python3
"""
用户管理功能数据库迁移脚本
用于将现有的用户表扩展为完整的用户管理系统
"""

import sys
import os
import sqlite3
from datetime import datetime
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.data.db import init_db, get_session, engine
from backend.data.models import User
from backend.data.user_management_models import (
    UserRole, UserPreference, UserActivityLog, UserSession,
    UserGroup, UserGroupMember
)
from backend.config import Settings


def create_user_management_tables():
    """创建用户管理相关的表"""
    print("创建用户管理相关表...")
    
    try:
        # 导入所有模型以确保它们被注册
        from backend.data.user_management_models import (
            UserRole, UserPreference, UserActivityLog, UserSession,
            UserGroup, UserGroupMember
        )
        
        # 使用 SQLAlchemy 的 create_all 方法创建所有表
        from backend.data.db import Base
        Base.metadata.create_all(engine, checkfirst=True)
        print("✓ 所有用户管理表创建完成")
        
    except Exception as e:
        print(f"✗ 创建用户管理表失败: {e}")


def extend_users_table():
    """扩展现有 users 表，添加新字段"""
    print("扩展 users 表...")
    
    # 需要添加的新字段
    new_columns = [
        ("full_name", "VARCHAR(100)"),
        ("avatar_url", "VARCHAR(500)"),
        ("phone", "VARCHAR(20)"),
        ("department", "VARCHAR(100)"),
        ("position", "VARCHAR(100)"),
        ("timezone", "VARCHAR(50) DEFAULT 'UTC'"),
        ("language", "VARCHAR(10) DEFAULT 'zh-CN'"),
        ("email_verified", "BOOLEAN DEFAULT 0"),
        ("phone_verified", "BOOLEAN DEFAULT 0"),
        ("two_factor_enabled", "BOOLEAN DEFAULT 0"),
        ("failed_login_attempts", "INTEGER DEFAULT 0"),
        ("locked_until", "TIMESTAMP"),
        ("password_changed_at", "TIMESTAMP"),
        ("last_activity_at", "TIMESTAMP"),
    ]
    
    # 获取数据库连接
    db_path = project_root / "hua_news.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # 检查每个字段是否已存在
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        for column_name, column_def in new_columns:
            if column_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_def}")
                    print(f"✓ 添加字段: {column_name}")
                except Exception as e:
                    print(f"✗ 添加字段 {column_name} 失败: {e}")
            else:
                print(f"- 字段 {column_name} 已存在，跳过")
        
        conn.commit()
        
    except Exception as e:
        print(f"✗ 扩展 users 表失败: {e}")
        conn.rollback()
    finally:
        conn.close()


def insert_default_data():
    """插入默认数据"""
    print("插入默认数据...")
    
    db = get_session()
    
    try:
        # 插入默认角色
        default_roles = [
            {
                'name': 'admin',
                'display_name': '系统管理员',
                'description': '拥有系统所有权限',
                'permissions': '["user:read", "user:write", "user:delete", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete", "system:read", "system:write"]',
                'is_system_role': True
            },
            {
                'name': 'editor',
                'display_name': '内容编辑者',
                'description': '可以管理新闻内容和RSS源',
                'permissions': '["user:read", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete"]',
                'is_system_role': True
            },
            {
                'name': 'user',
                'display_name': '普通用户',
                'description': '可以查看和搜索新闻内容',
                'permissions': '["article:read", "search:read"]',
                'is_system_role': True
            },
            {
                'name': 'guest',
                'display_name': '访客',
                'description': '只能查看公开内容',
                'permissions': '["article:read"]',
                'is_system_role': True
            }
        ]
        
        for role_data in default_roles:
            existing_role = db.query(UserRole).filter_by(name=role_data['name']).first()
            if not existing_role:
                role = UserRole(**role_data)
                db.add(role)
                print(f"✓ 插入角色: {role_data['name']}")
            else:
                print(f"- 角色 {role_data['name']} 已存在，跳过")
        
        # 插入默认用户组
        default_groups = [
            {
                'id': 1,
                'name': '系统管理员组',
                'description': '系统管理员专用组'
            },
            {
                'id': 2,
                'name': '内容编辑组',
                'description': '负责内容编辑的用户组'
            },
            {
                'id': 3,
                'name': '普通用户组',
                'description': '普通用户组'
            }
        ]
        
        for group_data in default_groups:
            existing_group = db.query(UserGroup).filter_by(id=group_data['id']).first()
            if not existing_group:
                group = UserGroup(**group_data)
                db.add(group)
                print(f"✓ 插入用户组: {group_data['name']}")
            else:
                print(f"- 用户组 {group_data['name']} 已存在，跳过")
        
        db.commit()
        print("✓ 默认数据插入完成")
        
    except Exception as e:
        print(f"✗ 插入默认数据失败: {e}")
        db.rollback()
    finally:
        db.close()


def migrate_existing_users():
    """迁移现有用户数据"""
    print("迁移现有用户数据...")
    
    db = get_session()
    
    try:
        # 获取所有现有用户
        existing_users = db.query(User).all()
        
        for user in existing_users:
            # 设置默认时区和语言
            if not hasattr(user, 'timezone') or user.timezone is None:
                user.timezone = 'UTC'
            if not hasattr(user, 'language') or user.language is None:
                user.language = 'zh-CN'
            
            # 设置密码修改时间
            if not hasattr(user, 'password_changed_at') or user.password_changed_at is None:
                user.password_changed_at = user.created_at
            
            # 根据角色设置用户组
            if user.role == 'admin':
                # 添加到管理员组
                admin_group = db.query(UserGroup).filter_by(name='系统管理员组').first()
                if admin_group:
                    existing_membership = db.query(UserGroupMember).filter_by(
                        group_id=admin_group.id, user_id=user.id
                    ).first()
                    if not existing_membership:
                        membership = UserGroupMember(
                            group_id=admin_group.id,
                            user_id=user.id,
                            role='admin'
                        )
                        db.add(membership)
                        print(f"✓ 将用户 {user.username} 添加到管理员组")
            
            elif user.role == 'editor':
                # 添加到编辑组
                editor_group = db.query(UserGroup).filter_by(name='内容编辑组').first()
                if editor_group:
                    existing_membership = db.query(UserGroupMember).filter_by(
                        group_id=editor_group.id, user_id=user.id
                    ).first()
                    if not existing_membership:
                        membership = UserGroupMember(
                            group_id=editor_group.id,
                            user_id=user.id,
                            role='member'
                        )
                        db.add(membership)
                        print(f"✓ 将用户 {user.username} 添加到编辑组")
            
            else:
                # 添加到普通用户组
                user_group = db.query(UserGroup).filter_by(name='普通用户组').first()
                if user_group:
                    existing_membership = db.query(UserGroupMember).filter_by(
                        group_id=user_group.id, user_id=user.id
                    ).first()
                    if not existing_membership:
                        membership = UserGroupMember(
                            group_id=user_group.id,
                            user_id=user.id,
                            role='member'
                        )
                        db.add(membership)
                        print(f"✓ 将用户 {user.username} 添加到普通用户组")
        
        db.commit()
        print("✓ 现有用户数据迁移完成")
        
    except Exception as e:
        print(f"✗ 迁移现有用户数据失败: {e}")
        db.rollback()
    finally:
        db.close()


def create_indexes():
    """创建索引"""
    print("创建索引...")
    
    db_path = project_root / "hua_news.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action)",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)",
            "CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(group_id)",
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                print(f"✓ 创建索引: {index_sql.split()[-1]}")
            except Exception as e:
                print(f"✗ 创建索引失败: {e}")
        
        conn.commit()
        
    except Exception as e:
        print(f"✗ 创建索引失败: {e}")
        conn.rollback()
    finally:
        conn.close()


def main():
    """主函数"""
    print("开始用户管理功能数据库迁移...")
    print("=" * 50)
    
    try:
        # 0. 初始化数据库连接
        print("初始化数据库连接...")
        settings = Settings()
        init_db(settings.database_url, settings)
        print("✓ 数据库连接初始化完成")
        print()
        
        # 1. 创建新表
        create_user_management_tables()
        print()
        
        # 2. 扩展 users 表
        extend_users_table()
        print()
        
        # 3. 插入默认数据
        insert_default_data()
        print()
        
        # 4. 迁移现有用户数据
        migrate_existing_users()
        print()
        
        # 5. 创建索引
        create_indexes()
        print()
        
        print("=" * 50)
        print("✓ 用户管理功能数据库迁移完成！")
        
    except Exception as e:
        print(f"✗ 迁移过程中发生错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
