项目运行说明（本地开发）

## 目录（Quick Preview）
- [截图（Snapshots）](#sec-snapshots)
- [项目概览](#sec-overview)
- [先决条件](#sec-prereq)
- [后端（Flask API）](#sec-backend)
- [前端（Next.js）](#sec-frontend)
- [接口文档](#sec-openapi)

<a id="sec-snapshots"></a>
## 截图（Snapshots）

> 以下为系统原型与页面截图，更多请查看 `snapshot/` 目录。

- 仪表盘（总览）

  ![仪表盘](snapshot/%E4%BB%AA%E8%A1%A8%E7%9B%98.png)
  
  展示今日入库、待处理、检索请求等关键指标，快速了解系统运行态。

- 知识库（列表/筛选/批量操作）

  ![知识库](snapshot/%E7%9F%A5%E8%AF%86%E5%BA%93.png)
  
  支持按来源/时间/标签筛选，行内编辑标签，批量删除与导入数据。

- 语义搜索（RAG 结果与引用）

  ![搜索](snapshot/%E6%90%9C%E7%B4%A2.png)
  
  先检索知识库按相似度排序，未命中可触发联网补充，结果含引用来源。

- 模型与 API 配置

  ![模型](snapshot/%E6%A8%A1%E5%9E%8B.png)
  
  配置 Ollama/LLM、Embedding、Rerank 等参数，支持在线保存与热更新。

- 用户与角色

  ![用户](snapshot/%E7%94%A8%E6%88%B7.png)
  
  管理用户、角色与权限，支持禁用/删除与角色分配操作。

- RSS 源管理（新增/编辑/抓取）

  ![RSS 管理](snapshot/rss.png)

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
PORT=5000                                      # 后端端口，默认 5000

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

### 4. 启动后端
```
uv run backend/app.py
```
默认监听：`http://localhost:5000`

健康检查：`GET http://localhost:5000/api/health` → `{ "status": "ok" }`

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

如后端运行在 5000 端口（默认），推荐在 `frontend/.env.local` 设置：
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

或者将后端端口改为 5050 启动：
```
PORT=5050 uv run backend/app.py
```

### 3. 启动前端
```
npm run dev
```
默认访问：`http://localhost:3000`

## 五、常用脚本
- 后端运行：`uv run backend/app.py`
- 后端（带自定义端口）：`PORT=5050 uv run backend/app.py`
- 前端开发：`cd frontend && npm run dev`
- 前端构建：`cd frontend && npm run build && npm run start`
- 前端测试：`cd frontend && npm test`

<a id="sec-openapi"></a>
## 六、接口文档
参见根目录 `openapi.yaml`，后端默认基准 URL：`http://localhost:5000`。

## 七、常见问题（FAQ）
1) 前端报错无法访问 API
   - 确认 `NEXT_PUBLIC_API_BASE_URL` 指向后端实际地址
   - 要么修改 `.env.local` 为后端端口（例如 5000），要么用 `PORT=5050` 启动后端与前端默认保持一致

2) RAG/QA 无法使用或报 LangChain 未安装
   - 执行：`uv sync -E langchain`
   - 确保本机有可用的 LLM 服务（例如 Ollama）并已拉取对应模型

3) 数据库文件位置
   - 默认在项目根目录 `hua_news.db`，首次启动会自动创建
   - 可用 `DATABASE_URL` 指向自定义路径（例如绝对路径）

## 八、目录结构（简要）
```
backend/        # Flask 后端
frontend/       # Next.js 前端
db/             # schema 与 seed 脚本
openapi.yaml    # OpenAPI 接口定义
hua_news.db     # 默认 SQLite 数据库文件（运行后生成）
```

## 九、开发提示
- 后端已启用 CORS，支持跨域请求
- 后端会定时抓取 RSS（后台任务），首次可等待一段时间以出现数据
- 如需自定义模型/向量化配置，参考接口 `/api/settings/models`

## 十、接口测试（API Tests）

- HTTP 集合（适配 VS Code REST Client/JetBrains HTTP）：
  - 文件：`tests/api.http`
  - 使用：打开文件，按每段上方的 `Send Request` 即可；默认基址为 `http://localhost:5000`。

- Python 冒烟测试（requests）：
  - 文件：`tests/smoke_test.py`
  - 环境变量（可选）：
    - `API_BASE_URL`（默认 `http://localhost:5000`）
    - `API_USERNAME`、`API_PASSWORD`
  - 运行：
    ```
    uv run python tests/smoke_test.py
    ```



