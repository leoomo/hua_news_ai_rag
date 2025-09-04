# 后端接口文档（Flask API）

基址：`http://localhost:5050`（或你的实际端口）

认证：当前接口多为公开演示用途。若前端携带 JWT，将在需要的地方验证。

---

## 目录
- 认证 Auth
- 用户管理 Users
- 用户角色管理 User Roles
- 用户组管理 User Groups
- 用户偏好设置 User Preferences
- 用户会话管理 User Sessions
- 用户活动日志 User Activity Logs
- RSS 源管理 RSS
- 知识库 KB（含仪表盘汇总、调度器）
- 模型与系统设置 Models/Settings
- 邮件配置 Email Settings
- 邮件测试 Email Test
- 健康检查 Health

---

## 认证 Auth

### POST /api/auth/login
用户登录认证
请求体（JSON）：
```json
{
  "username": "admin",
  "password": "admin123"
}
```
响应（200）：
```json
{ "code": 0, "token": "<JWT>" }
```
错误：400 缺参数；401 账号或密码错误

---

## 用户管理 Users

前缀：`/api`

### GET /api/users
获取用户列表（支持分页和筛选）
查询参数：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `search`: 搜索关键词（用户名或邮箱）
- `role`: 角色筛选
- `department`: 部门筛选
- `is_active`: 是否激活

响应：
```json
{
  "code": 0,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "full_name": "管理员",
        "department": "IT",
        "is_active": true,
        "last_login": "2025-09-04T10:00:00Z",
        "created_at": "2025-09-01T08:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### GET /api/users/stats
获取用户统计信息
响应：
```json
{
  "code": 0,
  "data": {
    "total_users": 10,
    "active_users": 8,
    "inactive_users": 2,
    "users_by_role": {
      "admin": 2,
      "user": 8
    },
    "users_by_department": {
      "IT": 5,
      "Marketing": 3,
      "Sales": 2
    }
  }
}
```

### POST /api/users
创建新用户
请求体：
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user",
  "full_name": "新用户",
  "department": "IT"
}
```
响应：`{ "code": 0, "data": {"id": <newId>} }`

### PATCH /api/users
更新用户信息
请求体：
```json
{
  "id": 1,
  "username": "updateduser",
  "email": "updated@example.com",
  "role": "admin",
  "full_name": "更新用户",
  "department": "IT",
  "is_active": true
}
```

### DELETE /api/users?id=1
删除用户

---

## 用户角色管理 User Roles

前缀：`/api`

### GET /api/user-roles
获取角色列表
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "display_name": "管理员",
      "description": "系统管理员角色",
      "permissions": ["read", "write", "delete", "admin"],
      "is_system_role": true,
      "created_at": "2025-09-01T08:00:00Z",
      "updated_at": "2025-09-01T08:00:00Z"
    }
  ]
}
```

### POST /api/user-roles
创建新角色
请求体：
```json
{
  "name": "editor",
  "display_name": "编辑",
  "description": "内容编辑角色",
  "permissions": ["read", "write"]
}
```

### PATCH /api/user-roles
更新角色
请求体：
```json
{
  "id": 1,
  "name": "admin",
  "display_name": "系统管理员",
  "description": "系统管理员角色",
  "permissions": ["read", "write", "delete", "admin"]
}
```

### DELETE /api/user-roles?id=1
删除角色

---

## 用户组管理 User Groups

前缀：`/api`

### GET /api/user-groups
获取用户组列表
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "developers",
      "description": "开发团队",
      "created_by": 1,
      "created_at": "2025-09-01T08:00:00Z",
      "updated_at": "2025-09-01T08:00:00Z",
      "member_count": 5
    }
  ]
}
```

### POST /api/user-groups
创建用户组
请求体：
```json
{
  "name": "marketing",
  "description": "市场团队"
}
```

### PATCH /api/user-groups
更新用户组
请求体：
```json
{
  "id": 1,
  "name": "development",
  "description": "开发团队"
}
```

### DELETE /api/user-groups?id=1
删除用户组

### POST /api/user-groups/members
添加组成员
请求体：
```json
{
  "group_id": 1,
  "user_id": 2
}
```

### DELETE /api/user-groups/members
移除组成员
请求体：
```json
{
  "group_id": 1,
  "user_id": 2
}
```

---

## 用户偏好设置 User Preferences

前缀：`/api`

### GET /api/users/{user_id}/preferences
获取用户偏好设置
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "preference_key": "theme",
      "preference_value": "dark",
      "created_at": "2025-09-01T08:00:00Z",
      "updated_at": "2025-09-01T08:00:00Z"
    }
  ]
}
```

### POST /api/users/{user_id}/preferences
设置用户偏好
请求体：
```json
{
  "preference_key": "language",
  "preference_value": "zh_cn"
}
```

### PATCH /api/users/{user_id}/preferences
更新用户偏好
请求体：
```json
{
  "id": 1,
  "preference_value": "light"
}
```

### DELETE /api/users/{user_id}/preferences?id=1
删除用户偏好

---

## 用户会话管理 User Sessions

前缀：`/api`

### GET /api/users/{user_id}/sessions
获取用户会话列表
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "session_token": "token123",
      "refresh_token": "refresh123",
      "expires_at": "2025-09-05T08:00:00Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "is_active": true,
      "created_at": "2025-09-04T08:00:00Z"
    }
  ]
}
```

### POST /api/users/{user_id}/sessions
创建用户会话
请求体：
```json
{
  "session_token": "token123",
  "refresh_token": "refresh123",
  "expires_at": "2025-09-05T08:00:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

### DELETE /api/users/{user_id}/sessions?id=1
删除用户会话

---

## 用户活动日志 User Activity Logs

前缀：`/api`

### GET /api/user-activity-logs
获取活动日志列表
查询参数：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `user_id`: 用户ID筛选
- `action`: 操作类型筛选
- `resource_type`: 资源类型筛选
- `start_date`: 开始日期
- `end_date`: 结束日期

响应：
```json
{
  "code": 0,
  "data": {
    "logs": [
      {
        "id": 1,
        "user_id": 1,
        "action": "login",
        "resource_type": "user",
        "resource_id": 1,
        "details": {"ip": "192.168.1.1"},
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-09-04T08:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### POST /api/user-activity-logs
记录用户活动
请求体：
```json
{
  "user_id": 1,
  "action": "create",
  "resource_type": "article",
  "resource_id": 123,
  "details": {"title": "新文章"},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

---

## RSS 源管理 RSS

前缀：`/api/settings`

### GET /api/settings/rss
获取RSS源列表
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "BBC News",
      "url": "http://feeds.bbci.co.uk/news/rss.xml",
      "category": "news",
      "is_active": true,
      "last_fetch": "2025-09-04T10:00:00Z"
    }
  ]
}
```

### POST /api/settings/rss
创建RSS源
请求体：
```json
{
  "name": "Tech News",
  "url": "https://example.com/tech.rss",
  "category": "tech",
  "is_active": true
}
```

### PATCH /api/settings/rss
更新RSS源
请求体：
```json
{
  "id": 1,
  "name": "BBC News",
  "url": "http://feeds.bbci.co.uk/news/rss.xml",
  "category": "news",
  "is_active": true
}
```

### DELETE /api/settings/rss?id=1
删除RSS源

### POST /api/settings/rss/ingest?id=1
触发单一源采集
响应：
```json
{
  "code": 0,
  "data": {
    "created": 5,
    "skipped": 2,
    "email": {
      "enabled": true,
      "sent": true,
      "message": "邮件发送成功，已通知 1 位收件人",
      "recipients": ["user@example.com"],
      "send_time": "2025-09-04T10:05:00Z",
      "failure_reason": ""
    }
  }
}
```

### POST /api/settings/rss/ingest_all
触发所有启用源批量采集
响应：
```json
{
  "code": 0,
  "data": {
    "results": [
      {
        "id": 1,
        "code": 0,
        "created": 3,
        "skipped": 1
      }
    ],
    "summary": {
      "total_created": 3,
      "total_skipped": 1,
      "email": {
        "enabled": true,
        "sent": true,
        "message": "批量采集完成，邮件发送成功，已通知 1 位收件人",
        "recipients": ["user@example.com"],
        "send_time": "2025-09-04T10:05:00Z",
        "failure_reason": ""
      }
    }
  }
}
```

### GET /api/settings/rss/status
获取最近采集状态列表
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "source_id": 1,
      "url": "http://feeds.bbci.co.uk/news/rss.xml",
      "status": "success",
      "created": 10,
      "skipped": 2,
      "error_message": null,
      "created_at": "2025-09-04T10:00:00Z"
    }
  ]
}
```

---

## 知识库 KB 与仪表盘

前缀：`/api`

### GET /api/kb/items
获取最新文章列表
响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "title": "重要新闻标题",
      "content": "文章内容...",
      "source_name": "BBC News",
      "source_url": "https://www.bbc.com/news/article",
      "category": "news",
      "created_at": "2025-09-04T10:00:00Z",
      "summary": "文章摘要..."
    }
  ]
}
```

### POST /api/kb/items
创建新文章
请求体：
```json
{
  "title": "文章标题",
  "content": "文章内容",
  "source_name": "来源名称",
  "source_url": "https://example.com/article",
  "category": "news",
  "summary": "文章摘要"
}
```

### DELETE /api/kb/items/{id}
删除单条文章

### POST /api/kb/items/batch-delete
批量删除文章
请求体：
```json
{
  "ids": [1, 2, 3]
}
```

### POST /api/kb/items/import
批量导入文章
请求体：
```json
{
  "items": [
    {
      "title": "文章标题",
      "content": "文章内容",
      "source_name": "来源名称",
      "source_url": "https://example.com/article",
      "category": "news",
      "published_at": "2025-09-04T10:00:00Z"
    }
  ]
}
```

### GET /api/dashboard/summary
获取仪表盘汇总数据
响应：
```json
{
  "code": 0,
  "data": {
    "total_articles": 1234,
    "last7": [
      {"date": "2025-09-01", "count": 10},
      {"date": "2025-09-02", "count": 15}
    ],
    "latest": [
      {
        "id": 1,
        "title": "最新文章",
        "source_name": "BBC News",
        "source_url": "https://www.bbc.com/news/article",
        "created_at": "2025-09-04T10:00:00Z"
      }
    ],
    "latest_update": "2025-09-04T10:00:00Z",
    "today_count": 20,
    "yesterday_count": 18,
    "top_categories": [
      {"name": "科技", "count": 30},
      {"name": "新闻", "count": 25}
    ],
    "top_sources": [
      {"name": "BBC News", "count": 50},
      {"name": "CNN", "count": 45}
    ]
  }
}
```

### 调度器管理
- GET /api/scheduler/status → `{ enabled: bool, jobs: [ {id,next_run_time,...} ] }`
- POST /api/scheduler/start
- POST /api/scheduler/stop

---

## 模型与系统设置

前缀：`/api/settings`

### GET /api/settings/models
获取模型配置
响应：
```json
{
  "code": 0,
  "data": {
    "llm": "qwen2.5:3b",
    "embedding": "sentence-transformers/all-MiniLM-L6-v2",
    "reranker": "ms-marco-MiniLM-L-6-v2",
    "ollama_url": "http://localhost:11434"
  }
}
```

### PUT /api/settings/models
更新模型配置
请求体：
```json
{
  "llm": "qwen2.5:7b",
  "embedding": "sentence-transformers/all-MiniLM-L6-v2",
  "reranker": "ms-marco-MiniLM-L-6-v2",
  "ollama_url": "http://localhost:11434"
}
```

---

## 邮件配置 Email Settings

前缀：`/api/settings`

### GET /api/settings/email
获取当前邮件配置
响应：
```json
{
  "code": 0,
  "data": {
    "enable_email_module": true,
    "enable_email_notification": true,
    "recipient_emails": ["user@example.com"],
    "sender_name": "华新AI知识库系统",
    "sender_email": "noreply@example.com",
    "sender_password": "***",
    "email_provider": "163",
    "custom_smtp_config": {
      "smtp_host": "smtp.163.com",
      "smtp_port": 465,
      "smtp_use_tls": false,
      "smtp_use_ssl": true
    },
    "max_articles_in_email": 10,
    "email_template_language": "zh_cn",
    "email_format": "markdown",
    "email_send_timeout": 30,
    "email_retry_count": 3,
    "email_retry_delay": 5
  }
}
```

### POST /api/settings/email
更新邮件配置
请求体：
```json
{
  "enable_email_module": true,
  "enable_email_notification": true,
  "recipient_emails": ["user@example.com"],
  "sender_name": "华新AI知识库系统",
  "sender_email": "noreply@example.com",
  "sender_password": "password123",
  "email_provider": "163",
  "custom_smtp_config": {
    "smtp_host": "smtp.163.com",
    "smtp_port": 465,
    "smtp_use_tls": false,
    "smtp_use_ssl": true
  },
  "max_articles_in_email": 10,
  "email_template_language": "zh_cn",
  "email_format": "markdown",
  "email_send_timeout": 30,
  "email_retry_count": 3,
  "email_retry_delay": 5
}
```

---

## 邮件测试 Email Test

前缀：`/api`

### POST /api/email/test
测试邮件发送功能
请求体：
```json
{
  "recipient": "test@example.com",
  "subject": "测试邮件",
  "content": "这是一封测试邮件"
}
```
响应：
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "测试邮件发送成功",
    "send_time": "2025-09-04T10:00:00Z"
  }
}
```

---

## 健康检查

### GET /api/health
系统健康检查
响应：
```json
{ "status": "ok" }
```

---

## 备注

### 通用响应格式
- 成功响应：`{ "code": 0, "data": {...} }`
- 错误响应：`{ "code": 400/500, "msg": "错误信息" }`
- `code=0` 表示成功，其他值表示错误

### 时间格式
- 所有时间字段使用 ISO 8601 格式（UTC）
- 格式：`YYYY-MM-DDTHH:mm:ssZ`
- 前端在展示时转换为本地时区

### 分页参数
- `page`: 页码，从1开始
- `limit`: 每页数量，默认20
- 分页响应包含 `total`、`page`、`limit` 字段

### 邮件状态说明
- `enabled`: 邮件模块是否启用
- `sent`: 邮件是否发送成功
- `message`: 邮件发送状态消息
- `recipients`: 收件人列表
- `send_time`: 发送时间
- `failure_reason`: 失败原因（仅失败时）

### 用户管理功能
- 支持用户CRUD操作
- 支持角色和权限管理
- 支持用户组管理
- 支持用户偏好设置
- 支持会话管理
- 支持活动日志记录

### RSS采集功能
- 支持单个和批量采集
- 采集结果包含邮件通知状态
- 支持采集状态查询
- 支持调度器管理

### 知识库功能
- 支持文章CRUD操作
- 支持批量导入和删除
- 提供仪表盘汇总数据
- 支持语义搜索

### 系统配置
- 模型配置持久化存储
- 邮件配置数据库存储
- 支持邮件发送测试