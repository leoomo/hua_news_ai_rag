项目运行说明（本地开发）

## 目录（Quick Preview）
- [截图（Snapshots）](#sec-snapshots)
- [项目概览](#sec-overview)
- [先决条件](#sec-prereq)
- [后端（Flask API）](#sec-backend)
- [前端（Next.js）](#sec-frontend)
- [常用脚本](#sec-scripts)
- [接口文档](#sec-openapi)
- [常见问题（FAQ）](#sec-faq)
- [目录结构（详细）](#sec-structure)
- [开发提示](#sec-dev-tips)
- [接口测试（API Tests）](#sec-api-tests)
- [模块结构具体说明](#sec-module-structure)

<a id="sec-snapshots"></a>
## 截图（Snapshots）

> 以下为系统原型与页面截图，更多请查看 `snapshot/` 目录。

- 仪表盘（总览）

  ![仪表盘](snapshot/%E4%BB%AA%E8%A1%A8%E7%9B%98.png)
  
  展示总数、今日/昨日新增（含同比箭头）、近7天日均、分类/来源 Top3（可点击跳转到知识库筛选）、最近更新时间；右侧含"最近 7 天入库"（数值置于柱形上方、比例优化）与"最新 8 篇"。采用统一灰白毛玻璃风格，卡片圆角设计，悬停微浮起效果。

- 知识库（列表/筛选/批量操作）

  ![知识库](snapshot/%E7%9F%A5%E8%AF%86%E5%BA%93.png)
  
  支持按来源/时间/标签筛选，行内编辑标签，批量删除与导入数据。来源和分类支持点击跳转，表格行悬停高亮，整体采用圆角卡片设计。

- 知识库编辑模式

  ![知识库编辑](snapshot/%E7%9F%A5%E8%AF%86%E5%BA%93_%E7%BC%96%E8%BE%91.png)
  
  支持行内编辑文章标签和分类，实时保存修改。编辑状态输入框采用统一圆角设计，聚焦状态有灰色环形提示。

- 语义搜索（RAG 结果与引用）

  ![搜索](snapshot/%E6%90%9C%E7%B4%A2.png)
  
  先检索知识库按相似度排序，未命中可触发联网补充，结果含引用来源。搜索结果卡片采用毛玻璃效果，悬停微浮起，整体保持灰白极简风格。

- 高级搜索功能

  ![高级搜索](snapshot/%E6%90%9C%E7%B4%A22.png)
  
  支持多种搜索模式，包括语义搜索、关键词搜索和混合搜索，提供更精准的检索结果。搜索框采用圆角设计，聚焦状态有灰色环形提示。

- 网络搜索结果

  ![网络搜索](snapshot/%E6%90%9C%E7%B4%A2_%E7%BD%91%E7%BB%9C%E6%90%9C%E7%B4%A2.png)
  
  当本地知识库未找到相关内容时，自动触发网络搜索，提供补充信息。网络结果采用统一卡片样式，与本地结果保持视觉一致。

- 模型与 API 配置

  ![模型](snapshot/%E6%A8%A1%E5%9E%8B.png)
  
  配置 Ollama/LLM、Embedding、Rerank 等参数，支持在线保存与热更新。配置卡片采用毛玻璃效果，输入框统一圆角设计，保存按钮采用灰黑主题。

- 用户与角色

  ![用户](snapshot/%E7%94%A8%E6%88%B7.png)
  
  管理用户、角色与权限，支持禁用/删除与角色分配操作。表格采用圆角卡片设计，操作按钮统一样式，悬停状态有微浮起效果。

- RSS 源管理（新增/编辑/抓取）

  ![RSS 管理](snapshot/rss.png)
  
  支持 RSS 源的新增、编辑、删除操作，以及手动采集和批量采集功能。采集按钮集成进度显示，自动采集状态有呼吸灯效果，整体采用统一灰白风格。

- 数据分析（关键词/趋势等）

  ![数据分析](snapshot/%E5%88%86%E6%9E%90.png)
  
  提供关键词Top、入库趋势等洞察，辅助理解内容结构与变化。数据卡片采用毛玻璃效果，悬停微浮起，与仪表盘保持视觉一致。

- 系统设置

  ![系统设置](snapshot/%E7%B3%BB%E7%BB%9F.png)
  
  邮件配置、功能开关、发送参数等系统级设置。配置卡片采用毛玻璃效果，输入框统一圆角设计，提示信息采用灰色信息条样式。

<a id="sec-overview"></a>
## 一、项目概览
- 后端：Flask + SQLAlchemy（Python 3.11+）
- 前端：Next.js 14 + React 18（Node.js 18/20+）
- 数据库：SQLite（默认 `hua_news.db`，无需手动建表）
- 包管理：Python 使用 uv，前端使用 npm

<a id="sec-prereq"></a>
## 二、先决条件
1) 安装 Python 3.11+
2) 安装 uv（Python 包管理与运行）
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
3) 安装 Node.js（建议 20+）与 npm
4) 可选：Ollama（用于本地大模型问答 RAG）
   - 安装参考：`https://ollama.com/`
   - 拉取模型（示例，与后端默认一致）：`ollama pull qwen2.5:3b`

<a id="sec-backend"></a>
## 三、后端（Flask API）
目录：`backend/`

### 1. 安装依赖
在项目根目录执行：
```
uv sync
```
可选安装 LangChain 功能（用于 RAG/QA）：
```
uv sync -E langchain
```

### 2. 环境变量（可选）
不设置也能跑，以下为可覆盖项：
```
DATABASE_URL=sqlite:///绝对路径/hua_news.db     # 默认：项目根的 hua_news.db
SECRET_KEY=dev-secret-key                      # 会话密钥
PORT=5050                                      # 后端端口，默认 5050

# 抓取/切分/嵌入等（均有默认值）
FETCH_TIMEOUT_SEC=8
FETCH_RETRIES=3
RATE_LIMIT_DOMAIN_QPS=1
ENABLE_ENRICH=true
ENABLE_EMBED=true
EMBED_BATCH_SIZE=64
CHUNK_SIZE=800
CHUNK_OVERLAP=120
SIMHASH_HAMMING_THRESHOLD=4
```

### 3. 初始化数据库（可选）
程序启动时会自动建表。如需导入示例数据（如果有）：
```
sqlite3 hua_news.db < db/seed.sql
```

### 4. 启动后端（推荐方式）
使用封装的启动脚本，避免相对导入问题：
```
cd backend
source ../.venv/bin/activate
python run.py               # 默认端口 5050
# 或自定义端口：PORT=8080 python run.py
```
默认监听：`http://localhost:5050`

健康检查：`GET http://localhost:5050/api/health` → `{ "status": "ok" }`

> 兼容方式：也可使用 Flask 命令行启动
> ```bash
> source .venv/bin/activate
> python -m flask --app backend.core.app run --host=0.0.0.0 --port=5001 --debug
> ```

### 5. 启动 RAG/QA（可选）
仅当已执行 `uv sync -E langchain` 且本机有可用 LLM（如 Ollama）时：
- 确保本地已运行 Ollama，且存在模型 `qwen2.5:3b`
- QA 相关接口详见 `openapi.yaml` 中的 `/api/search/qa`

<a id="sec-frontend"></a>
## 四、前端（Next.js）
目录：`frontend/`

### 1. 安装依赖
```
cd frontend
npm install
```

### 2. 环境变量
前端通过 `NEXT_PUBLIC_API_BASE_URL` 访问后端，默认 `http://localhost:5050`。

如后端运行在 5001 端口（兼容方式），推荐在 `frontend/.env.local` 设置：
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

### 3. 启动前端
```
npm run dev
```
默认访问：`http://localhost:3000`

<a id="sec-scripts"></a>
## 五、常用脚本

### 后端服务
```bash
# 标准启动（端口 5050）
cd backend
source ../.venv/bin/activate
python run.py

# 自定义端口启动
cd backend
source ../.venv/bin/activate
PORT=8080 python run.py

# 开发模式（自动重载）
cd backend
source ../.venv/bin/activate
FLASK_ENV=development python run.py
```

### 前端服务
```bash
# 开发模式
cd frontend
npm run dev

# 生产构建
cd frontend
npm run build
npm run start

# 测试
cd frontend
npm test
```

### 数据库管理
```bash
# 查看数据库状态
sqlite3 hua_news.db ".tables"
sqlite3 hua_news.db "SELECT COUNT(*) FROM news_articles;"

# 导入示例数据（如果有）
sqlite3 hua_news.db < db/seed.sql
```

### 开发工具
```bash
# 修复导入问题（如需要）
cd backend
python fix_imports.py

# 测试邮件配置
cd backend/email_fly
python test_email.py

# 生成 OpenAPI（自动扫描路由）
cd backend
uv run python scripts/export_openapi.py
# 生成结果：doc/openapi.generated.yaml
```

### 邮件模块
```bash
# 快速配置邮件通知
cd backend/email_fly
cp email_config_example.py email_config.py
# 编辑 email_config.py 文件，填入邮箱配置
# 测试邮件功能
python test_email.py
```

<a id="sec-openapi"></a>
<a id="sec-openapi"></a>
## 六、接口文档
参见根目录 `openapi.yaml`，后端默认基准 URL：`http://localhost:5050`。

- 更易读的接口说明文档（Markdown）：`doc/backend_api.md`

### 核心 API 端点
- **健康检查**: `GET /api/health`
- **RSS 管理**: `GET /api/settings/rss`
- **知识库**: `GET /api/kb/items`
- **仪表板**: `GET /api/dashboard/summary`
- **用户认证**: `POST /api/auth/login`
- **系统设置**: `GET /api/settings`（来自 `routes/settings.py`）

### API 测试
项目包含完整的 API 测试套件：
- **HTTP 集合**: `tests/api.http` (VS Code REST Client)
- **冒烟测试**: `tests/smoke_test.py` (Python requests)
- **测试报告**: `tests/api_test_report.md`

<a id="sec-faq"></a>
## 七、常见问题（FAQ）

### 🔌 连接问题
1) **前端报错无法访问 API**
   - 确认 `NEXT_PUBLIC_API_BASE_URL` 指向后端实际地址
   - 默认配置：前端 `http://localhost:3000` ↔ 后端 `http://localhost:5050`
   - 如需要，可在 `frontend/.env.local` 中设置：`NEXT_PUBLIC_API_BASE_URL=http://localhost:5050`

2) **端口冲突**
   - 检查端口 5050 和 3000 是否被占用：`lsof -i :5050` 和 `lsof -i :3000`
   - 如冲突，可修改后端端口：`PORT=8080 python run.py`

### 🐍 Python 相关问题
3) **导入错误 (ImportError)**
   - 运行修复脚本：`cd backend && python fix_imports.py`
   - 确保使用正确的启动方式：`python run.py`

4) **虚拟环境问题**
   - 确保激活虚拟环境：`source .venv/bin/activate`
   - 检查 Python 版本：`python --version` (建议 3.11+)

### 🗄️ 数据库问题
5) **数据库连接失败**
   - 确认 `hua_news.db` 文件路径正确
   - 检查 `backend/config.py` 中的 `database_url` 配置
   - 默认路径：项目根目录的 `hua_news.db`

6) **表不存在错误**
   - 首次启动会自动创建表结构
   - 如需要，可手动检查：`sqlite3 hua_news.db ".tables"`

### 🤖 AI 功能问题
7) **RAG/QA 无法使用**
   - 执行：`uv sync -E langchain`
   - 确保本机有可用的 LLM 服务（例如 Ollama）
   - 拉取模型：`ollama pull qwen2.5:3b`

8) **向量搜索失败**
   - 检查 FAISS 索引是否正确创建
   - 确认文本嵌入服务正常运行
   - 查看后端日志中的错误信息

### 🚀 启动问题
9) **后端启动失败**
   - 检查依赖是否安装完整：`uv sync`
   - 确认端口未被占用
   - 查看错误日志，常见问题已在上方列出

10) **前端启动失败**
    - 检查 Node.js 版本：`node --version` (建议 18+)
    - 重新安装依赖：`cd frontend && rm -rf node_modules && npm install`
    - 清除缓存：`npm run dev -- --clear`

<a id="sec-structure"></a>
## 八、目录结构（详细）

### 项目根目录
```
hua_news_ai_rag/           # 项目根目录
├── backend/               # 后端模块（重构后的模块化架构）
├── frontend/              # Next.js 前端应用
├── tests/                 # 接口测试文件
├── snapshot/              # 系统截图
├── doc/                   # 项目文档
├── prototype/             # 前端原型
├── openapi.yaml           # OpenAPI 接口定义
├── hua_news.db            # SQLite 数据库文件
├── pyproject.toml         # Python 项目配置
└── README.md              # 项目说明文档
```

### 后端模块结构
```
backend/
├── core/                  # 核心应用层
│   ├── app.py            # Flask 主应用入口
│   └── __init__.py       # 核心模块初始化
├── data/                  # 数据层
│   ├── db.py             # 数据库连接和会话管理
│   ├── models.py         # SQLAlchemy ORM 模型
│   └── __init__.py       # 数据层初始化
├── ai/                    # AI 服务层
│   ├── embeddings.py     # 文本嵌入服务（sentence-transformers）
│   ├── enrich.py         # 文本增强工具（摘要、关键词提取）
│   ├── qa.py             # 问答系统（LangChain）
│   ├── vectorstore.py    # 向量搜索功能（FAISS）
│   └── __init__.py       # AI 层初始化
├── crawler/               # 数据采集层
│   ├── fetcher.py        # HTTP 抓取器（限速、robots.txt 支持）
│   ├── ingest.py         # RSS 采集和内容处理
│   ├── ingest_utils.py   # 采集工具和数据库模式管理
│   └── __init__.py       # 采集层初始化
├── routes/                # API 路由层
│   ├── auth.py           # 认证端点
│   ├── users.py          # 用户管理端点
│   ├── rss.py            # RSS 源管理端点
│   ├── kb.py             # 知识库和搜索端点
│   ├── models_settings.py # AI 模型配置端点
│   ├── settings.py       # 系统设置端点（新）
│   └── __init__.py       # 路由层初始化
├── services/              # 领域服务（新）
│   ├── ai_summary.py     # AI 摘要服务
│   ├── web_search.py     # 联网搜索服务
│   └── __init__.py       # 服务层初始化
├── utils/                 # 工具层
│   ├── test_rss.py       # RSS 测试工具
│   └── __init__.py       # 工具层初始化
├── email_fly/             # 邮件模块
│   ├── email_config.py   # 邮件配置文件
│   └── ...
├── config.py              # 应用配置（Pydantic 设置）
├── run.py                 # 后端服务启动文件
└── __init__.py            # 后端模块初始化
```

### 模块职责说明

#### 🔧 核心应用层 (core/)
- **app.py**: Flask 应用主入口，注册蓝图、配置调度器、健康检查
- 负责应用生命周期管理、中间件配置、错误处理

#### 🗄️ 数据层 (data/)
- **db.py**: 数据库连接池管理、会话管理、动态列添加
- **models.py**: 数据模型定义（用户、文章、RSS源、日志等）
- 提供数据访问抽象，支持 SQLite 和未来扩展

#### 🤖 AI 服务层 (ai/)
- **embeddings.py**: 文本向量化服务，支持多种嵌入模型
- **enrich.py**: 文本增强（摘要、关键词提取）
- **qa.py**: 基于 LangChain 的问答系统
- **vectorstore.py**: FAISS 向量数据库操作

#### 🕷️ 数据采集层 (crawler/)
- **fetcher.py**: 智能 HTTP 抓取，支持限速、重试、robots.txt
- **ingest.py**: RSS 源采集、内容解析、去重处理
- **ingest_utils.py**: 采集工具、数据库模式管理、SimHash 去重

#### 🌐 API 路由层 (routes/)
- **auth.py**: JWT 认证、登录登出、权限验证
- **users.py**: 用户 CRUD、角色管理、权限控制
- **rss.py**: RSS 源管理、采集触发、状态监控
- **kb.py**: 知识库管理、搜索接口、数据分析
- **models_settings.py**: AI 模型配置、参数调优
- **settings.py**: 系统设置接口（如开关、阈值、外部服务配置）

#### 🧩 领域服务 (services/)
- **ai_summary.py**: 复用 AI 能力为业务提供摘要服务
- **web_search.py**: 联网检索、聚合外部信息

#### 🛠️ 工具层 (utils/)
- **test_rss.py**: RSS 功能测试、调试工具

#### 📧 邮件模块 (email_fly/)
- **email_config.py** 等：邮件服务配置与工具

<a id="sec-dev-tips"></a>
## 九、开发提示
- 后端已启用 CORS，支持跨域请求
- 后端会定时抓取 RSS（后台任务），首次可等待一段时间以出现数据
- 如需自定义模型/向量化配置，参考接口 `/api/settings/models`

<a id="sec-api-tests"></a>
## 十、接口测试（API Tests）

### HTTP 集合测试
- **文件**: `tests/api.http`
- **工具**: VS Code REST Client / JetBrains HTTP Client
- **使用**: 打开文件，按每段上方的 `Send Request` 即可
- **默认基址**: `http://localhost:5050`

### Python 冒烟测试
- **文件**: `tests/smoke_test.py`
- **环境变量**（可选）:
  - `API_BASE_URL`（默认 `http://localhost:5050`）
  - `API_USERNAME`、`API_PASSWORD`
- **运行**:
  ```bash
  cd tests
  source ../.venv/bin/activate
  python smoke_test.py
  ```

### 测试报告
- **文件**: `tests/api_test_report.md`
- **内容**: 包含详细的测试结果和问题分析

<a id="sec-module-structure"></a>
## 十一、模块结构具体说明

（同上方“后端模块结构/模块职责说明”，此处不再重复）



