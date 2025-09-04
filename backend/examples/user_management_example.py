#!/usr/bin/env python3
"""
用户管理功能使用示例
展示如何使用新的用户管理功能
"""

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.data.db import get_session
from backend.data.models import User
from backend.data.user_management_models import (
    UserRole, UserPreference, UserActivityLog, UserSession,
    UserGroup, UserGroupMember, UserNotificationSetting, UserApiKey
)
from datetime import datetime, timedelta
import json


def example_user_management():
    """用户管理功能示例"""
    db = get_session()
    
    try:
        print("=== 用户管理功能示例 ===\n")
        
        # 1. 创建用户角色
        print("1. 创建用户角色")
        admin_role = UserRole(
            name='super_admin',
            display_name='超级管理员',
            description='拥有所有权限的超级管理员',
            permissions=json.dumps(['*']),  # 所有权限
            is_system_role=False
        )
        db.add(admin_role)
        db.commit()
        print(f"✓ 创建角色: {admin_role.display_name}")
        
        # 2. 创建用户组
        print("\n2. 创建用户组")
        dev_group = UserGroup(
            name='开发团队',
            description='负责系统开发的团队',
            created_by=1  # 假设用户ID为1
        )
        db.add(dev_group)
        db.commit()
        print(f"✓ 创建用户组: {dev_group.name}")
        
        # 3. 创建用户
        print("\n3. 创建用户")
        new_user = User(
            username='test_user',
            email='test@example.com',
            password_hash='hashed_password',
            role='user',
            full_name='测试用户',
            department='技术部',
            position='开发工程师',
            timezone='Asia/Shanghai',
            language='zh-CN'
        )
        db.add(new_user)
        db.commit()
        print(f"✓ 创建用户: {new_user.username}")
        
        # 4. 添加用户到组
        print("\n4. 添加用户到组")
        membership = UserGroupMember(
            group_id=dev_group.id,
            user_id=new_user.id,
            role='member'
        )
        db.add(membership)
        db.commit()
        print(f"✓ 将用户 {new_user.username} 添加到组 {dev_group.name}")
        
        # 5. 设置用户偏好
        print("\n5. 设置用户偏好")
        preferences = [
            UserPreference(
                user_id=new_user.id,
                preference_key='theme',
                preference_value=json.dumps({'mode': 'dark', 'primary_color': '#3b82f6'})
            ),
            UserPreference(
                user_id=new_user.id,
                preference_key='notifications',
                preference_value=json.dumps({'email': True, 'push': False, 'in_app': True})
            ),
            UserPreference(
                user_id=new_user.id,
                preference_key='dashboard_layout',
                preference_value=json.dumps({'columns': 3, 'widgets': ['recent_articles', 'search_stats', 'user_activity']})
            )
        ]
        
        for pref in preferences:
            db.add(pref)
        db.commit()
        print(f"✓ 设置用户偏好: {len(preferences)} 项")
        
        # 6. 创建用户会话
        print("\n6. 创建用户会话")
        session = UserSession(
            user_id=new_user.id,
            session_token='session_token_12345',
            refresh_token='refresh_token_67890',
            expires_at=datetime.utcnow() + timedelta(hours=24),
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            is_active=True
        )
        db.add(session)
        db.commit()
        print(f"✓ 创建用户会话: {session.session_token[:20]}...")
        
        # 7. 记录用户活动
        print("\n7. 记录用户活动")
        activities = [
            UserActivityLog(
                user_id=new_user.id,
                action='login',
                resource_type='user',
                resource_id=new_user.id,
                details=json.dumps({'method': 'password', 'success': True}),
                ip_address='192.168.1.100',
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ),
            UserActivityLog(
                user_id=new_user.id,
                action='search',
                resource_type='article',
                details=json.dumps({'query': '人工智能', 'results_count': 15}),
                ip_address='192.168.1.100'
            ),
            UserActivityLog(
                user_id=new_user.id,
                action='update_preference',
                resource_type='user_preference',
                details=json.dumps({'preference_key': 'theme', 'old_value': 'light', 'new_value': 'dark'}),
                ip_address='192.168.1.100'
            )
        ]
        
        for activity in activities:
            db.add(activity)
        db.commit()
        print(f"✓ 记录用户活动: {len(activities)} 条")
        
        # 8. 设置通知偏好
        print("\n8. 设置通知偏好")
        notification_settings = [
            UserNotificationSetting(
                user_id=new_user.id,
                notification_type='email',
                event_type='new_article',
                is_enabled=True
            ),
            UserNotificationSetting(
                user_id=new_user.id,
                notification_type='in_app',
                event_type='system_update',
                is_enabled=True
            ),
            UserNotificationSetting(
                user_id=new_user.id,
                notification_type='push',
                event_type='new_article',
                is_enabled=False
            )
        ]
        
        for setting in notification_settings:
            db.add(setting)
        db.commit()
        print(f"✓ 设置通知偏好: {len(notification_settings)} 项")
        
        # 9. 创建API密钥
        print("\n9. 创建API密钥")
        api_key = UserApiKey(
            user_id=new_user.id,
            key_name='开发环境API密钥',
            api_key='api_key_abcdef123456',
            permissions=json.dumps(['article:read', 'search:read']),
            expires_at=datetime.utcnow() + timedelta(days=90),
            is_active=True
        )
        db.add(api_key)
        db.commit()
        print(f"✓ 创建API密钥: {api_key.key_name}")
        
        # 10. 查询和展示数据
        print("\n10. 查询和展示数据")
        
        # 查询用户信息
        user_info = db.query(User).filter_by(username='test_user').first()
        print(f"用户信息: {user_info.username} ({user_info.full_name})")
        print(f"  部门: {user_info.department}")
        print(f"  职位: {user_info.position}")
        print(f"  时区: {user_info.timezone}")
        print(f"  语言: {user_info.language}")
        
        # 查询用户偏好
        user_prefs = db.query(UserPreference).filter_by(user_id=user_info.id).all()
        print(f"\n用户偏好设置 ({len(user_prefs)} 项):")
        for pref in user_prefs:
            value = json.loads(pref.preference_value) if pref.preference_value else None
            print(f"  {pref.preference_key}: {value}")
        
        # 查询用户活动
        user_activities = db.query(UserActivityLog).filter_by(user_id=user_info.id).order_by(UserActivityLog.created_at.desc()).limit(5).all()
        print(f"\n最近活动 ({len(user_activities)} 条):")
        for activity in user_activities:
            details = json.loads(activity.details) if activity.details else {}
            print(f"  {activity.action} - {activity.resource_type} - {activity.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 查询用户组信息
        user_groups = db.query(UserGroupMember).filter_by(user_id=user_info.id).all()
        print(f"\n用户组信息 ({len(user_groups)} 个组):")
        for membership in user_groups:
            group = db.query(UserGroup).filter_by(id=membership.group_id).first()
            print(f"  {group.name} (角色: {membership.role})")
        
        print("\n=== 示例完成 ===")
        
    except Exception as e:
        print(f"✗ 示例执行失败: {e}")
        db.rollback()
    finally:
        db.close()


def example_permission_check():
    """权限检查示例"""
    db = get_session()
    
    try:
        print("\n=== 权限检查示例 ===\n")
        
        # 获取用户角色
        user = db.query(User).filter_by(username='test_user').first()
        if not user:
            print("用户不存在")
            return
        
        # 获取角色权限
        role = db.query(UserRole).filter_by(name=user.role).first()
        if role:
            permissions = json.loads(role.permissions) if role.permissions else []
            print(f"用户 {user.username} 的角色: {role.display_name}")
            print(f"权限列表: {permissions}")
            
            # 检查特定权限
            required_permissions = ['article:read', 'user:write', 'system:read']
            for perm in required_permissions:
                has_permission = perm in permissions or '*' in permissions
                print(f"  权限 '{perm}': {'✓' if has_permission else '✗'}")
        else:
            print(f"角色 {user.role} 不存在")
        
    except Exception as e:
        print(f"✗ 权限检查失败: {e}")
    finally:
        db.close()


def example_user_analytics():
    """用户分析示例"""
    db = get_session()
    
    try:
        print("\n=== 用户分析示例 ===\n")
        
        # 用户总数
        total_users = db.query(User).count()
        print(f"总用户数: {total_users}")
        
        # 按角色统计
        role_stats = db.query(User.role, db.func.count(User.id)).group_by(User.role).all()
        print("\n按角色统计:")
        for role, count in role_stats:
            print(f"  {role}: {count} 人")
        
        # 活跃用户（有最近活动的用户）
        active_users = db.query(User).join(UserActivityLog).filter(
            UserActivityLog.created_at >= datetime.utcnow() - timedelta(days=7)
        ).distinct().count()
        print(f"\n最近7天活跃用户: {active_users}")
        
        # 用户活动统计
        activity_stats = db.query(
            UserActivityLog.action,
            db.func.count(UserActivityLog.id)
        ).group_by(UserActivityLog.action).all()
        
        print("\n用户活动统计:")
        for action, count in activity_stats:
            print(f"  {action}: {count} 次")
        
        # 用户组统计
        group_stats = db.query(
            UserGroup.name,
            db.func.count(UserGroupMember.user_id)
        ).join(UserGroupMember).group_by(UserGroup.name).all()
        
        print("\n用户组统计:")
        for group_name, member_count in group_stats:
            print(f"  {group_name}: {member_count} 人")
        
    except Exception as e:
        print(f"✗ 用户分析失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # 运行示例
    example_user_management()
    example_permission_check()
    example_user_analytics()
