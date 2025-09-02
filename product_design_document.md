## 个性化新闻智能知识库产品设计文档

### 0. 说明
- 依据：`product_requirements_document.md`
- 目标：将需求转化为可实施的产品设计与技术方案，指导前后端与数据协作落地。

---

### 1. 信息架构（Information Architecture）

- 核心模块
  - 信息采集：RSS/网页抓取/上传 → 清洗 → 入库 → 邮件通知
  - 知识库管理：列表/筛选/批量操作/标签与来源维护
  - 语义查询：知识库优先 → 未命中触发联网 → LLM 归纳输出
  - 用户与权限：登录/角色/操作日志
  - 数据分析：关键词 Top10、趋势图

- 信息架构层级
  - 顶层导航：仪表盘｜知识库｜查询｜数据分析｜设置
  - 设置包含：RSS 源管理｜向量索引管理｜模型与 API 设置｜用户与角色

- 内容类型
  - 结构化内容：Excel/CSV 新闻条目（字段：标题、内容、来源、时间、标签等）
  - 非结构化内容：网页正文文本（解析为段落块）

---

### 2. 用户体验与交互设计（UX & Flows）

- 登录与访问
  1) 用户输入账号密码 → 2) 后端验证生成 JWT → 3) 前端存储在 HttpOnly Cookie → 4) 进入仪表盘

- RSS/抓取配置与采集
  1) 设置 RSS 源/抓取规则 → 2) 后端定时任务抓取 → 3) 清洗去重 → 4) 入库（SQLite + FAISS 向量）→ 5) 邮件通知

- 知识库管理
  1) 列表查看（按类型/时间/来源、标签筛选）→ 2) 选中条目批量删除/编辑元数据 → 3) 导入/上传结构化数据

- 语义查询（RAG）
  1) 用户输入问题 → 2) 向量检索知识库（相似度排序）→ 3) 命中则重排+生成 → 4) 未命中触发联网搜索 → 5) LLM 汇总生成 → 6) 呈现可追溯来源

- 数据分析
  1) 选择时间范围/来源 → 2) 计算关键词分布、Top10 → 3) 图表展示 → 4) 导出报表

- 错误与反馈
  - 全局错误提示条（网络、权限、超时）
  - 表单内联校验（URL、必填项、格式）

---

### 3. 前端设计（Next.js）

- 技术栈
  - Next.js 14+（App Router）/ React 18+
  - UI：Ant Design 或 Material UI
  - 状态管理：Zustand/Redux Toolkit
  - 样式：Tailwind CSS

- 目录结构（示例）
```
frontend/
  app/
    layout.tsx
    page.tsx                # 仪表盘
    login/page.tsx          # 登录
    kb/page.tsx             # 知识库列表
    kb/[id]/page.tsx        # 详情与元数据编辑
    search/page.tsx         # 语义搜索
    analytics/page.tsx      # 分析报告
    settings/
      rss/page.tsx          # RSS 管理
      models/page.tsx       # 模型与API配置
      users/page.tsx        # 用户与角色
  components/
    charts/*                # 图表组件
    forms/*                 # 表单组件
    tables/*                # 表格组件
  lib/
    api.ts                  # API 封装（包含JWT携带）
    auth.ts                 # 登录态/权限
    validators.ts           # 表单校验
```

- 关键页面要点
  - 登录：手机号/邮箱+密码；错误提示；登录成功跳转仪表盘
  - 知识库：表格（标题、来源、标签、时间、状态）；筛选（类型、时间、来源、标签）；批量操作
  - 搜索：输入框、搜索历史、结果列表（相似度、摘要、来源链接、引用片段）
  - 分析：可筛时间范围、来源；展示关键词 Top10 柱状图、趋势折线图
  - 设置：RSS 源增删改、抓取周期；LLM/嵌入/重排模型配置；API Key 管理

---

### 4. 后端设计（Flask）

- 技术栈
  - Flask 3.x、Gunicorn、APScheduler（定时）、Celery+Redis（异步）、SQLAlchemy 2.x、SQLite、FAISS
  - LangChain 集成 LLM/Embeddings/RAG 流程

- 目录结构（示例）
```
backend/
  app.py                     # 入口/注册蓝图
  config.py                  # 配置与环境变量
  extensions.py              # db、redis、celery、faiss等实例化
  models/                    # SQLAlchemy模型
    user.py
    article.py
    rss.py
    log.py
  services/
    auth_service.py          # JWT/权限
    rss_service.py           # RSS 管理与抓取
    ingest_service.py        # 清洗/去重/入库/向量化
    search_service.py        # 向量检索/重排/联网补充
    notify_service.py        # 邮件通知
    analytics_service.py     # 关键词/聚类分析
    model_service.py         # LLM/Embedding封装
  tasks/
    scheduler.py             # APScheduler 定时
    jobs.py                  # Celery 任务
  api/
    routes_auth.py
    routes_kb.py
    routes_search.py
    routes_settings.py
    routes_analytics.py
```

- 服务边界
  - AuthService：登录、JWT、角色与权限
  - RSS/Ingest：拉取数据、正文抽取、去重、入库、向量化
  - Search：相似度检索、重排、RAG 生成、联网补充
  - Analytics：关键词统计/Top10、趋势
  - Notify：入库成功邮件通知

---

### 5. 数据模型设计（SQLite + FAISS）

- users
  - id, username, email, password_hash, role, created_at, updated_at, last_login, is_active

- news_articles
  - id, title, content, source_url, source_name, published_at, category, tags(JSON), importance_score, status, created_at, updated_at, vector_id

- rss_sources
  - id, name, url, category, is_active, last_fetch, fetch_interval, created_at

- query_logs
  - id, user_id, query_text, query_type(semantic|keyword|hybrid), result_count, response_time, created_at

- FAISS
  - 索引：IVFFlat (dim=384, nlist=100)
  - 向量ID = 文章ID 或 文章ID-分片ID（若分块）

- 约束
  - 入库前去重（url+标题hash）
  - 文章长文本分块（1000字/200重叠），分块级别向量化与检索

---

### 6. API 设计（REST, JSON）

- 认证与用户
  - POST /api/auth/login：{username, password} → {token}
  - GET /api/auth/me：获取当前用户信息
  - GET /api/users：仅管理员可用

- 知识库
  - GET /api/kb/items?type=&tag=&from=&to=&page=&size=
  - POST /api/kb/items：上传结构化数据（支持表格多条）
  - PATCH /api/kb/items/{id}：编辑元数据（标签、来源等）
  - DELETE /api/kb/items/{id|batch}：单条或批量删除

- RSS/抓取
  - GET /api/settings/rss：列表
  - POST /api/settings/rss：新增
  - PATCH /api/settings/rss/{id}：编辑
  - DELETE /api/settings/rss/{id}
  - POST /api/tasks/fetch_now：立即触发抓取

- 搜索与RAG
  - POST /api/search/semantic：{query, top_k} → 相似度结果+重排
  - POST /api/search/qa：RAG 问答（含引用与来源）
  - POST /api/search/fallback：联网补充（无命中时）

- 分析
  - GET /api/analytics/keywords?from=&to=&top=10
  - GET /api/analytics/trends?from=&to=&interval=day

- 通知
  - POST /api/notify/test：发送测试邮件

- 模型与配置
  - GET/PUT /api/settings/models：LLM/Embedding/重排模型、API Key、Ollama URL

- 响应规范
  - { code: 0, data: {}, msg: "ok" }；错误：{ code: 非0, msg: "错误原因" }

---

### 7. RAG 流程与 LangChain 集成

- 文档入库（Ingest）
  1) 分块（RecursiveCharacterTextSplitter：chunk=1000, overlap=200）
  2) 向量化（HuggingFaceEmbeddings：all-MiniLM-L6-v2）
  3) 存储（FAISS.from_texts，metadata：article_id, title, source, category, chunk_index）

- 查询检索（Retrieve）
  1) as_retriever(search_type=similarity, k=5)
  2) ContextualCompressionRetriever + LLMChainExtractor（压缩上下文）

- 生成回答（Generate）
  - 模型：Ollama(qwen2.5:3b)
  - 模板：包含上下文+问题，要求中文与引用
  - 输出：答案+引用列表（来源、链接、片段）

- 未命中回退（Fallback）
  - 触发外部搜索 API（如百度）→ 抽取摘要 → 归一化结构 → 再走 RAG 生成

---

### 8. 安全与合规设计

- 身份认证：JWT（HttpOnly Cookie，24h 过期），密码哈希（bcrypt）
- 访问控制：RBAC（user/editor/admin），细粒度接口权限
- 输入安全：参数化查询、XSS 输出编码、CSRF 防护
- 爬虫合规：robots.txt 遵循、限频、User-Agent 标识
- 日志与审计：登录/删除/批量操作全量记录

---

### 9. 非功能设计

- 性能：页面 <3s；检索 <5s；入库 >1000条/分钟
- 可用性：99.5%+；任务失败重试（Celery）
- 监控：Prometheus + Grafana；应用日志结构化；告警阈值
- 备份：SQLite、FAISS 索引每日备份；恢复演练

---

### 10. 里程碑与交付

- Alpha（MVP，4-6周）
  - 登录、RSS 入库、语义检索、基础RAG、知识库列表、简单分析
- Beta（6-10周）
  - 模型配置中心、重排、联网回退、批量操作、邮件通知、图表分析
- Release（10-12周）
  - 性能优化、安全加固、文档完善、灰度发布

---

### 11. 风险与应对
- 模型效果不稳：可热切换嵌入与LLM提供者，加入评估面板
- 数据质量差：加强清洗去重、提高抓取白名单质量
- 法务与版权：仅存储公开内容，保留引用来源，支持一键删除

---

文档版本：v1.0  
创建日期：2024-12  
负责人：产品设计
