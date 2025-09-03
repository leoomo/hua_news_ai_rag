# 后端接口文档（Flask API）

基址：`http://localhost:5050`（或你的实际端口）

认证：当前接口多为公开演示用途。若前端携带 JWT，将在需要的地方验证。

---

## 目录
- 认证 Auth
- 用户 Users
- RSS 源管理 RSS
- 知识库 KB（含仪表盘汇总、调度器）
- 模型与系统设置 Models/Settings
- 邮件配置 Email Settings
- 健康检查 Health

---

## 认证 Auth

### POST /api/auth/login
请求体（JSON）：
```
{
  "username": "admin",
  "password": "admin123"
}
```
响应（200）：
```
{ "code": 0, "token": "<JWT>" }
```
错误：400 缺参数；401 账号或密码错误

---

## 用户 Users

前缀：`/api`

### GET /api/users
响应：
```
{ "code": 0, "data": [ {"id":1,"username":"u","email":"e","role":"user"}, ... ] }
```

### POST /api/users
请求体：
```
{ "username":"u", "email":"e", "password":"p", "role":"user" }
```
响应：`{ "code":0, "data": {"id": <newId>} }`

### PATCH /api/users
请求体：`{ "id":1, "username": "...", "email":"...", "role":"..." }`

### DELETE /api/users?id=1

---

## RSS 源管理 RSS

前缀：`/api/settings`

### GET /api/settings/rss
响应：
```
{ "code":0, "data":[ {"id":1,"name":"BBC","url":"...","category":"tech","is_active":true}, ... ] }
```

### POST /api/settings/rss
请求体：`{ "name":"...", "url":"...", "category":"tech", "is_active": true }`

### PATCH /api/settings/rss
请求体：`{ "id":1, "name":"...", "url":"...", "category":"...", "is_active": true }`

### DELETE /api/settings/rss?id=1

### POST /api/settings/rss/ingest?id=1
触发单一源采集。响应：
```
{ "code":0, "data": { "created": n, "skipped": m } }
```

### POST /api/settings/rss/ingest_all
触发所有启用源采集。响应：`{ "code":0, "data": [ {"id":1, "code":0, ...}, ... ] }`

### GET /api/settings/rss/status
最近采集状态列表（由 `ingest_logs` 提供）：
```
{ "code":0, "data":[ { "id":<logId>, "source_id":1, "url":"...", "status":"success|failed", "created":10, "skipped":2, "error_message":null, "created_at":"..."}, ... ] }
```

---

## 知识库 KB 与仪表盘

前缀：`/api`

### GET /api/kb/items
最新文章列表（全部，前端自行分页）：
```
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "title": "...",
      "content": "...",
      "source_name": "新华社",
      "source_url": "https://...",
      "category": "时政",
      "created_at": "2025-09-03T08:00:00Z",
      "summary": "..."
    }
  ]
}
```

### POST /api/kb/items
（可选，若开放从前端新增）请求体：`{ title, content, source_name?, source_url?, category?, summary? }`

### DELETE /api/kb/items/{id}
删除单条。响应会携带最新总数用于前端同步。

### POST /api/kb/items/batch-delete
请求体：`{ ids: [1,2,3] }`

### POST /api/kb/items/import
批量导入请求体：`{ items: [ {title, content, source_name?, source_url?, category?, published_at?}, ... ] }`

### GET /api/dashboard/summary
仪表盘汇总：
```
{
  "code": 0,
  "data": {
    "total_articles": 1234,
    "last7": [ {"date":"2025-09-01","count":10}, ... ],
    "latest": [ {"id":1,"title":"...","source_name":"...","source_url":"...","created_at":"..."}, ... ],
    "latest_update": "2025-09-03T12:00:00Z",
    "today_count": 20,
    "yesterday_count": 18,
    "top_categories": [ {"name":"科技","count":30}, ... ],
    "top_sources": [ {"name":"新华社","count":50}, ... ]
  }
}
```

### 调度器
- GET /api/scheduler/status → `{ enabled: bool, jobs: [ {id,next_run_time,...} ] }`
- POST /api/scheduler/start
- POST /api/scheduler/stop

---

## 模型与系统设置

前缀：`/api/settings`

### GET /api/settings/models
返回当前模型/嵌入等配置：
```
{ "code":0, "data": { "llm":"qwen2.5:3b", "embedding":"sentence-transformers/all-MiniLM-L6-v2", "reranker":"ms-marco-MiniLM-L-6-v2", "ollama_url":"http://localhost:11434" } }
```

### PUT /api/settings/models
请求体：`{ llm, embedding, reranker?, ollama_url? }`

---

## 邮件配置 Email Settings

前缀：`/api/settings`

### GET /api/settings/email
获取当前邮件配置。

### POST /api/settings/email
更新邮件配置。请求体示例：
```
{
  "enable_email_module": true,
  "enable_email_notification": true,
  "recipient_emails": ["a@b.com"],
  "sender_name": "华新AI知识库系统",
  "sender_email": "noreply@example.com",
  "sender_password": "***",
  "email_provider": "163" | "custom",
  "custom_smtp_config": { "smtp_host":"...", "smtp_port":587, "smtp_use_tls":true, "smtp_use_ssl":false },
  "max_articles_in_email": 10,
  "email_template_language": "zh_cn",
  "email_format": "markdown",
  "email_send_timeout": 30,
  "email_retry_count": 3,
  "email_retry_delay": 5
}
```

---

## 健康检查

### GET /api/health
响应：`{ "status": "ok" }`

---

## 备注
- 返回格式一般为 `{ code, data?, msg? }`，`code=0` 表示成功。
- 时间一律以 UTC 存储与返回；前端在展示时转换本地时区。
- `source_url` 在采集入库时写入，可用于前端外链跳转。
