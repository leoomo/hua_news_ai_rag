# 用户管理功能设计文档

## 概述

本文档描述了HUA News AI RAG系统的用户管理功能扩展设计，包括数据库结构、功能模块和实现方案。

## 数据库结构设计

### 1. 核心表结构

#### 1.1 用户角色权限表 (user_roles)
- **用途**: 定义系统中的角色和权限
- **主要字段**:
  - `name`: 角色名称 (admin, editor, user, guest)
  - `display_name`: 显示名称
  - `permissions`: JSON格式的权限列表
  - `is_system_role`: 是否为系统内置角色

#### 1.2 用户配置表 (user_preferences)
- **用途**: 存储用户的个性化配置
- **主要字段**:
  - `user_id`: 用户ID
  - `preference_key`: 配置键名
  - `preference_value`: 配置值(JSON格式)

#### 1.3 用户活动日志表 (user_activity_logs)
- **用途**: 记录用户的所有操作活动
- **主要字段**:
  - `user_id`: 用户ID
  - `action`: 操作类型 (login, logout, create, update, delete, search)
  - `resource_type`: 资源类型 (user, article, rss_source)
  - `details`: 详细信息(JSON格式)
  - `ip_address`: IP地址
  - `user_agent`: 用户代理

#### 1.4 用户会话管理表 (user_sessions)
- **用途**: 管理用户登录会话
- **主要字段**:
  - `user_id`: 用户ID
  - `session_token`: 会话令牌
  - `refresh_token`: 刷新令牌
  - `expires_at`: 过期时间
  - `is_active`: 是否活跃

#### 1.5 用户组表 (user_groups)
- **用途**: 组织用户到不同的组
- **主要字段**:
  - `name`: 组名
  - `description`: 组描述
  - `created_by`: 创建者

#### 1.6 用户组成员关系表 (user_group_members)
- **用途**: 管理用户与组的关系
- **主要字段**:
  - `group_id`: 组ID
  - `user_id`: 用户ID
  - `role`: 在组中的角色 (member, admin)

#### 1.7 用户通知设置表 (user_notification_settings)
- **用途**: 管理用户的通知偏好
- **主要字段**:
  - `user_id`: 用户ID
  - `notification_type`: 通知类型 (email, push, in_app)
  - `event_type`: 事件类型 (new_article, system_update)
  - `is_enabled`: 是否启用

#### 1.8 用户API密钥表 (user_api_keys)
- **用途**: 管理用户的API访问密钥
- **主要字段**:
  - `user_id`: 用户ID
  - `key_name`: 密钥名称
  - `api_key`: API密钥
  - `permissions`: API权限(JSON格式)
  - `expires_at`: 过期时间

### 2. 用户表扩展字段

在现有 `users` 表基础上添加以下字段：

- `full_name`: 全名
- `avatar_url`: 头像URL
- `phone`: 电话号码
- `department`: 部门
- `position`: 职位
- `timezone`: 时区
- `language`: 语言偏好
- `email_verified`: 邮箱是否验证
- `phone_verified`: 手机是否验证
- `two_factor_enabled`: 是否启用双因子认证
- `failed_login_attempts`: 登录失败次数
- `locked_until`: 账户锁定到期时间
- `password_changed_at`: 密码修改时间
- `last_activity_at`: 最后活动时间

## 权限系统设计

### 1. 角色定义

#### 1.1 系统管理员 (admin)
- **权限**: 系统所有权限
- **功能**: 用户管理、系统配置、数据管理

#### 1.2 内容编辑者 (editor)
- **权限**: 内容管理权限
- **功能**: 新闻管理、RSS源管理、内容编辑

#### 1.3 普通用户 (user)
- **权限**: 基础查看权限
- **功能**: 新闻查看、搜索、个人设置

#### 1.4 访客 (guest)
- **权限**: 只读权限
- **功能**: 公开内容查看

### 2. 权限列表

```json
{
  "user:read": "查看用户信息",
  "user:write": "创建/编辑用户",
  "user:delete": "删除用户",
  "article:read": "查看新闻文章",
  "article:write": "创建/编辑新闻文章",
  "article:delete": "删除新闻文章",
  "rss:read": "查看RSS源",
  "rss:write": "创建/编辑RSS源",
  "rss:delete": "删除RSS源",
  "search:read": "执行搜索",
  "system:read": "查看系统信息",
  "system:write": "修改系统配置"
}
```

## 功能模块设计

### 1. 用户管理模块

#### 1.1 用户CRUD操作
- 创建用户
- 查看用户列表
- 编辑用户信息
- 删除用户
- 用户状态管理

#### 1.2 角色管理
- 角色分配
- 权限管理
- 角色继承

#### 1.3 用户组管理
- 创建用户组
- 组成员管理
- 组权限设置

### 2. 会话管理模块

#### 2.1 登录管理
- 用户认证
- 会话创建
- 令牌管理

#### 2.2 安全控制
- 登录失败限制
- 账户锁定
- 会话过期

### 3. 活动监控模块

#### 3.1 操作日志
- 用户操作记录
- 系统事件记录
- 审计跟踪

#### 3.2 统计分析
- 用户活跃度统计
- 操作频率分析
- 安全事件监控

### 4. 通知管理模块

#### 4.1 通知设置
- 通知类型配置
- 通知渠道设置
- 通知时间偏好

#### 4.2 通知发送
- 邮件通知
- 站内消息
- 推送通知

### 5. API管理模块

#### 5.1 API密钥管理
- 密钥生成
- 权限控制
- 使用统计

#### 5.2 API访问控制
- 请求限制
- 权限验证
- 日志记录

## 实现方案

### 1. 数据库迁移

使用 `backend/scripts/migrate_user_management.py` 脚本进行数据库迁移：

```bash
cd backend
python scripts/migrate_user_management.py
```

### 2. 模型更新

在 `backend/data/models.py` 中扩展 User 模型，添加新的关系和字段。

### 3. API接口扩展

在 `backend/routes/users.py` 中扩展用户管理API接口。

### 4. 前端界面更新

在 `frontend/app/settings/users/` 中更新用户管理界面。

## 安全考虑

### 1. 数据安全
- 密码加密存储
- 敏感信息脱敏
- 数据访问控制

### 2. 会话安全
- 令牌安全生成
- 会话超时控制
- 并发登录限制

### 3. 操作安全
- 操作权限验证
- 操作日志记录
- 异常行为监控

## 性能优化

### 1. 数据库优化
- 合理索引设计
- 查询优化
- 分页处理

### 2. 缓存策略
- 用户信息缓存
- 权限信息缓存
- 会话信息缓存

### 3. 并发处理
- 数据库连接池
- 异步处理
- 负载均衡

## 监控和运维

### 1. 系统监控
- 用户活跃度监控
- 系统性能监控
- 错误日志监控

### 2. 安全监控
- 登录异常监控
- 权限异常监控
- 数据访问监控

### 3. 运维支持
- 用户数据备份
- 系统配置管理
- 故障恢复支持

## 扩展性考虑

### 1. 水平扩展
- 数据库分片
- 服务分离
- 负载均衡

### 2. 功能扩展
- 插件化架构
- 模块化设计
- API版本管理

### 3. 集成扩展
- 第三方认证
- 外部系统集成
- 数据同步

## 总结

本用户管理功能设计提供了完整的用户生命周期管理、权限控制、安全监控和系统扩展能力。通过合理的数据库设计和模块化架构，能够满足企业级应用的用户管理需求，同时保持良好的性能和可维护性。
