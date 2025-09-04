#!/usr/bin/env python3
"""
简化的用户管理功能数据库迁移脚本
直接使用 SQLite 连接创建表
"""

import sys
import os
import sqlite3
from datetime import datetime
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

def create_tables():
    """创建用户管理相关的表"""
    print("创建用户管理相关表...")
    
    # 获取数据库连接
    db_path = project_root / "hua_news.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # 创建用户角色表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                permissions TEXT,
                is_system_role BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ 创建表: user_roles")
        
        # 创建用户偏好设置表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                preference_key VARCHAR(100) NOT NULL,
                preference_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        print("✓ 创建表: user_preferences")
        
        # 创建用户活动日志表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(50),
                resource_id INTEGER,
                details TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        print("✓ 创建表: user_activity_logs")
        
        # 创建用户会话表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                refresh_token VARCHAR(255),
                expires_at TIMESTAMP NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        print("✓ 创建表: user_sessions")
        
        # 创建用户组表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        print("✓ 创建表: user_groups")
        
        # 创建用户组成员关系表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role VARCHAR(50) DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        print("✓ 创建表: user_group_members")
        
        conn.commit()
        print("✓ 所有用户管理表创建完成")
        
    except Exception as e:
        print(f"✗ 创建表失败: {e}")
        conn.rollback()
    finally:
        conn.close()


def extend_users_table():
    """扩展现有 users 表，添加新字段"""
    print("扩展 users 表...")
    
    # 获取数据库连接
    db_path = project_root / "hua_news.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
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
    
    # 获取数据库连接
    db_path = project_root / "hua_news.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # 插入默认角色
        default_roles = [
            ('admin', '系统管理员', '拥有系统所有权限', '["user:read", "user:write", "user:delete", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete", "system:read", "system:write"]', 1),
            ('editor', '内容编辑者', '可以管理新闻内容和RSS源', '["user:read", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete"]', 1),
            ('user', '普通用户', '可以查看和搜索新闻内容', '["article:read", "search:read"]', 1),
            ('guest', '访客', '只能查看公开内容', '["article:read"]', 1)
        ]
        
        for role_data in default_roles:
            cursor.execute("SELECT id FROM user_roles WHERE name = ?", (role_data[0],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO user_roles (name, display_name, description, permissions, is_system_role)
                    VALUES (?, ?, ?, ?, ?)
                """, role_data)
                print(f"✓ 插入角色: {role_data[0]}")
            else:
                print(f"- 角色 {role_data[0]} 已存在，跳过")
        
        # 插入默认用户组
        default_groups = [
            (1, '系统管理员组', '系统管理员专用组'),
            (2, '内容编辑组', '负责内容编辑的用户组'),
            (3, '普通用户组', '普通用户组')
        ]
        
        for group_data in default_groups:
            cursor.execute("SELECT id FROM user_groups WHERE id = ?", (group_data[0],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO user_groups (id, name, description)
                    VALUES (?, ?, ?)
                """, group_data)
                print(f"✓ 插入用户组: {group_data[1]}")
            else:
                print(f"- 用户组 {group_data[1]} 已存在，跳过")
        
        conn.commit()
        print("✓ 默认数据插入完成")
        
    except Exception as e:
        print(f"✗ 插入默认数据失败: {e}")
        conn.rollback()
    finally:
        conn.close()


def create_indexes():
    """创建索引"""
    print("创建索引...")
    
    # 获取数据库连接
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
        # 1. 创建新表
        create_tables()
        print()
        
        # 2. 扩展 users 表
        extend_users_table()
        print()
        
        # 3. 插入默认数据
        insert_default_data()
        print()
        
        # 4. 创建索引
        create_indexes()
        print()
        
        print("=" * 50)
        print("✓ 用户管理功能数据库迁移完成！")
        
    except Exception as e:
        print(f"✗ 迁移过程中发生错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
