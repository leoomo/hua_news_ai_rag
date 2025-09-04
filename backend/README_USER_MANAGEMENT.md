# 用户管理功能使用指南

## 概述

本指南介绍如何使用HUA News AI RAG系统的扩展用户管理功能。这些功能提供了完整的用户生命周期管理、权限控制、活动监控和个性化设置。

## 快速开始

### 1. 数据库迁移

首先运行数据库迁移脚本，创建用户管理相关的表结构：

```bash
cd backend
python scripts/migrate_user_management.py
```

### 2. 验证安装

运行示例代码验证功能是否正常：

```bash
python examples/user_management_example.py
```

## 功能模块

### 1. 用户角色管理

#### 创建角色
```python
from backend.data.user_management_models import UserRole
import json

role = UserRole(
    name='content_manager',
    display_name='内容管理员',
    description='负责内容审核和管理',
    permissions=json.dumps(['article:read', 'article:write', 'article:delete']),
    is_system_role=False
)
db.add(role)
db.commit()
```

#### 查询角色
```python
# 获取所有角色
roles = db.query(UserRole).all()

# 获取特定角色
role = db.query(UserRole).filter_by(name='admin').first()
permissions = json.loads(role.permissions) if role.permissions else []
```

### 2. 用户组管理

#### 创建用户组
```python
from backend.data.user_management_models import UserGroup

group = UserGroup(
    name='编辑团队',
    description='负责内容编辑的团队',
    created_by=current_user_id
)
db.add(group)
db.commit()
```

#### 添加用户到组
```python
from backend.data.user_management_models import UserGroupMember

membership = UserGroupMember(
    group_id=group.id,
    user_id=user.id,
    role='member'  # 或 'admin'
)
db.add(membership)
db.commit()
```

### 3. 用户偏好设置

#### 设置用户偏好
```python
from backend.data.user_management_models import UserPreference
import json

# 主题设置
theme_pref = UserPreference(
    user_id=user.id,
    preference_key='theme',
    preference_value=json.dumps({
        'mode': 'dark',
        'primary_color': '#3b82f6',
        'font_size': 'medium'
    })
)
db.add(theme_pref)
db.commit()
```

#### 获取用户偏好
```python
preferences = db.query(UserPreference).filter_by(user_id=user.id).all()
for pref in preferences:
    value = json.loads(pref.preference_value) if pref.preference_value else None
    print(f"{pref.preference_key}: {value}")
```

### 4. 用户活动日志

#### 记录用户活动
```python
from backend.data.user_management_models import UserActivityLog
import json

activity = UserActivityLog(
    user_id=user.id,
    action='search',
    resource_type='article',
    details=json.dumps({
        'query': '人工智能',
        'results_count': 15,
        'filters': {'category': 'tech'}
    }),
    ip_address=request.remote_addr,
    user_agent=request.headers.get('User-Agent')
)
db.add(activity)
db.commit()
```

#### 查询用户活动
```python
# 获取用户最近活动
activities = db.query(UserActivityLog).filter_by(user_id=user.id)\
    .order_by(UserActivityLog.created_at.desc()).limit(10).all()

# 按操作类型统计
activity_stats = db.query(
    UserActivityLog.action,
    db.func.count(UserActivityLog.id)
).filter_by(user_id=user.id).group_by(UserActivityLog.action).all()
```

### 5. 会话管理

#### 创建用户会话
```python
from backend.data.user_management_models import UserSession
from datetime import datetime, timedelta

session = UserSession(
    user_id=user.id,
    session_token=generate_session_token(),
    refresh_token=generate_refresh_token(),
    expires_at=datetime.utcnow() + timedelta(hours=24),
    ip_address=request.remote_addr,
    user_agent=request.headers.get('User-Agent'),
    is_active=True
)
db.add(session)
db.commit()
```

#### 验证会话
```python
session = db.query(UserSession).filter_by(
    session_token=token,
    is_active=True
).first()

if session and session.expires_at > datetime.utcnow():
    # 会话有效
    session.last_accessed_at = datetime.utcnow()
    db.commit()
else:
    # 会话无效或过期
    pass
```

### 6. 通知设置

#### 设置通知偏好
```python
from backend.data.user_management_models import UserNotificationSetting

# 邮件通知设置
email_setting = UserNotificationSetting(
    user_id=user.id,
    notification_type='email',
    event_type='new_article',
    is_enabled=True
)
db.add(email_setting)
db.commit()
```

#### 检查通知设置
```python
settings = db.query(UserNotificationSetting).filter_by(
    user_id=user.id,
    notification_type='email',
    event_type='new_article'
).first()

if settings and settings.is_enabled:
    # 发送邮件通知
    send_email_notification(user.email, message)
```

### 7. API密钥管理

#### 创建API密钥
```python
from backend.data.user_management_models import UserApiKey
import json

api_key = UserApiKey(
    user_id=user.id,
    key_name='开发环境密钥',
    api_key=generate_api_key(),
    permissions=json.dumps(['article:read', 'search:read']),
    expires_at=datetime.utcnow() + timedelta(days=90),
    is_active=True
)
db.add(api_key)
db.commit()
```

#### 验证API密钥
```python
api_key_obj = db.query(UserApiKey).filter_by(
    api_key=api_key,
    is_active=True
).first()

if api_key_obj and (not api_key_obj.expires_at or api_key_obj.expires_at > datetime.utcnow()):
    # API密钥有效
    permissions = json.loads(api_key_obj.permissions) if api_key_obj.permissions else []
    api_key_obj.last_used_at = datetime.utcnow()
    db.commit()
else:
    # API密钥无效或过期
    return {'error': 'Invalid API key'}, 401
```

## 权限系统

### 权限检查

```python
def check_permission(user_id, required_permission):
    """检查用户是否有特定权限"""
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        return False
    
    role = db.query(UserRole).filter_by(name=user.role).first()
    if not role:
        return False
    
    permissions = json.loads(role.permissions) if role.permissions else []
    return required_permission in permissions or '*' in permissions

# 使用示例
if check_permission(user.id, 'article:write'):
    # 用户有写文章权限
    pass
```

### 资源级权限

```python
def check_resource_permission(user_id, resource_type, resource_id, action):
    """检查用户对特定资源的权限"""
    # 基础权限检查
    if not check_permission(user_id, f"{resource_type}:{action}"):
        return False
    
    # 资源所有者检查
    if resource_type == 'article':
        article = db.query(NewsArticle).filter_by(id=resource_id).first()
        return article and article.created_by == user_id
    
    return True
```

## 数据分析

### 用户活跃度分析

```python
def get_user_activity_stats(days=30):
    """获取用户活跃度统计"""
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # 活跃用户数
    active_users = db.query(User).join(UserActivityLog).filter(
        UserActivityLog.created_at >= since_date
    ).distinct().count()
    
    # 按日期统计活动
    daily_activity = db.query(
        db.func.date(UserActivityLog.created_at).label('date'),
        db.func.count(UserActivityLog.id).label('count')
    ).filter(
        UserActivityLog.created_at >= since_date
    ).group_by(
        db.func.date(UserActivityLog.created_at)
    ).all()
    
    return {
        'active_users': active_users,
        'daily_activity': daily_activity
    }
```

### 用户行为分析

```python
def analyze_user_behavior(user_id, days=7):
    """分析用户行为模式"""
    since_date = datetime.utcnow() - timedelta(days=days)
    
    activities = db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id,
        UserActivityLog.created_at >= since_date
    ).all()
    
    # 按操作类型分组
    action_groups = {}
    for activity in activities:
        action = activity.action
        if action not in action_groups:
            action_groups[action] = []
        action_groups[action].append(activity)
    
    return action_groups
```

## 最佳实践

### 1. 性能优化

- 使用索引优化查询性能
- 对频繁查询的数据进行缓存
- 使用分页处理大量数据

### 2. 安全考虑

- 定期清理过期的会话和API密钥
- 记录所有敏感操作
- 实施适当的访问控制

### 3. 数据维护

- 定期备份用户数据
- 清理过期的活动日志
- 监控数据库性能

### 4. 扩展性

- 使用模块化设计
- 支持插件化权限系统
- 考虑水平扩展需求

## 故障排除

### 常见问题

1. **数据库迁移失败**
   - 检查数据库连接
   - 确认表结构冲突
   - 查看错误日志

2. **权限检查失败**
   - 验证角色配置
   - 检查权限字符串格式
   - 确认用户角色分配

3. **会话管理问题**
   - 检查令牌生成逻辑
   - 验证过期时间设置
   - 确认会话清理机制

### 调试技巧

```python
# 启用SQL查询日志
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# 检查数据库状态
def check_database_status():
    tables = ['users', 'user_roles', 'user_preferences', 'user_activity_logs']
    for table in tables:
        count = db.execute(f"SELECT COUNT(*) FROM {table}").scalar()
        print(f"{table}: {count} records")
```

## 总结

用户管理功能为HUA News AI RAG系统提供了完整的用户生命周期管理能力。通过合理使用这些功能，可以构建安全、可扩展的用户管理系统，满足企业级应用的需求。

更多详细信息请参考：
- [用户管理设计文档](../doc/user_management_design.md)
- [数据库结构文件](../db/user_management_schema.sql)
- [示例代码](../examples/user_management_example.py)
