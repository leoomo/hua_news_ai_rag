#!/usr/bin/env python3
"""
数据库初始化脚本
用于创建和初始化华新AI知识库系统的数据库
"""

import sqlite3
import os
import sys
from pathlib import Path

def get_project_root():
    """获取项目根目录"""
    return Path(__file__).parent.parent

def init_database(db_path=None):
    """初始化数据库"""
    if db_path is None:
        db_path = get_project_root() / "hua_news.db"
    
    # 确保数据库目录存在
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    print(f"🔧 正在初始化数据库: {db_path}")
    
    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 读取初始化SQL文件
        sql_file = get_project_root() / "db" / "init_database.sql"
        if not sql_file.exists():
            print(f"❌ SQL初始化文件不存在: {sql_file}")
            return False
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # 执行SQL脚本
        print("📝 正在执行数据库初始化脚本...")
        cursor.executescript(sql_content)
        
        # 提交事务
        conn.commit()
        
        # 验证初始化结果
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_roles")
        role_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM rss_sources")
        rss_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM news_articles")
        article_count = cursor.fetchone()[0]
        
        print("✅ 数据库初始化完成!")
        print(f"   - 用户数量: {user_count}")
        print(f"   - 角色数量: {role_count}")
        print(f"   - RSS源数量: {rss_count}")
        print(f"   - 文章数量: {article_count}")
        
        # 显示默认用户信息
        cursor.execute("SELECT username, email, role FROM users WHERE is_active = 1")
        users = cursor.fetchall()
        print("\n👥 默认用户账户:")
        for username, email, role in users:
            print(f"   - {username} ({email}) - 角色: {role}")
        
        print(f"\n🔑 默认密码: admin123 / editor123 / user123")
        print(f"📧 请在生产环境中修改默认密码!")
        
        return True
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        return False
    finally:
        if conn:
            conn.close()

def backup_database(db_path=None):
    """备份现有数据库"""
    if db_path is None:
        db_path = get_project_root() / "hua_news.db"
    
    if not os.path.exists(db_path):
        print("ℹ️  数据库文件不存在，无需备份")
        return True
    
    backup_path = f"{db_path}.backup"
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ 数据库已备份到: {backup_path}")
        return True
    except Exception as e:
        print(f"❌ 数据库备份失败: {e}")
        return False

def main():
    """主函数"""
    print("🚀 华新AI知识库系统 - 数据库初始化工具")
    print("=" * 50)
    
    # 获取数据库路径
    db_path = None
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    
    # 检查是否需要备份
    if db_path is None:
        db_path = get_project_root() / "hua_news.db"
    
    if os.path.exists(db_path):
        response = input(f"⚠️  数据库文件已存在: {db_path}\n是否要备份现有数据库? (y/N): ")
        if response.lower() in ['y', 'yes']:
            if not backup_database(db_path):
                print("❌ 备份失败，终止初始化")
                return False
    
    # 初始化数据库
    success = init_database(db_path)
    
    if success:
        print("\n🎉 数据库初始化完成!")
        print("📋 下一步:")
        print("   1. 启动后端服务: cd backend && python run.py")
        print("   2. 启动前端服务: cd frontend && npm run dev")
        print("   3. 访问系统: http://localhost:3000")
        print("   4. 使用默认账户登录")
    else:
        print("\n❌ 数据库初始化失败!")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
