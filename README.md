# 华新AI知识库系统

> 基于AI的智能新闻采集、处理和检索系统，支持RSS源管理、知识库构建、语义搜索和邮件通知等功能。

## 📋 目录

- [🚀 快速开始](#快速开始)
- [📸 系统截图](#系统截图)
- [🏗️ 项目概览](#项目概览)
- [⚙️ 系统要求](#系统要求)
- [🔧 安装指南](#安装指南)
- [🚀 启动服务](#启动服务)
- [📚 功能特性](#功能特性)
- [🔌 API接口](#api接口)
- [📁 项目结构](#项目结构)
- [🛠️ 开发指南](#开发指南)
- [❓ 常见问题](#常见问题)
- [📖 相关文档](#相关文档)

## 🚀 快速开始

### 一键安装
```bash
# 克隆项目
git clone https://github.com/leoomo/hua_news_ai_rag.git
cd hua_news_ai_rag

# 运行一键安装脚本
python install.py
```

### 手动安装
```bash
# 1. 后端设置
python scripts/setup_backend.py

# 2. 前端设置
python scripts/setup_frontend.py

# 3. 数据库初始化
python scripts/init_database.py
```

### 启动服务
```bash
# 启动后端
cd backend && python run.py

# 启动前端
cd frontend && npm run dev
```

### 访问系统
- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:5050
- **默认账户**: admin / admin123

---

## 📸 系统截图

> 以下为系统原型与页面截图，更多请查看 `snapshot/` 目录。

- 登录页面

  ![登录](snapshot/%E7%99%BB%E5%BD%95.png)
  
  简洁现代的登录界面，支持用户名/密码认证。具备加载状态显示（旋转动画）、错误处理和成功提示功能。采用极简灰白设计，圆角输入框，悬停效果。

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
。

- 网络搜索结果

  ![网络搜索](snapshot/%E6%90%9C%E7%B4%A22.png)
  
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

## 🏗️ 项目概览

华新AI知识库系统是一个基于AI的智能新闻采集、处理和检索平台，集成了现代化的Web技术栈和AI能力。

### 技术栈
- **后端**: Flask + SQLAlchemy + LangChain（Python 3.11+）
- **前端**: Next.js 14 + React 18 + TypeScript（Node.js 18+）
- **数据库**: SQLite（支持扩展至PostgreSQL/MySQL）
- **AI能力**: 文本嵌入、向量搜索、智能问答、内容摘要
- **包管理**: Python使用uv，前端使用npm

### 核心功能
- 🔍 **智能搜索**: 基于向量相似度的语义搜索
- 📰 **RSS采集**: 自动化新闻源采集和内容处理
- 📚 **知识库管理**: 文章分类、标签、批量操作
- 👥 **用户管理**: 角色权限、用户组、活动日志
- 📧 **邮件通知**: 采集完成通知、系统消息推送
- 🤖 **AI问答**: 基于知识库的智能问答系统
- 📊 **数据分析**: 关键词分析、趋势统计、可视化展示

## ⚙️ 系统要求

### 最低要求
- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Python**: 3.11 或更高版本
- **Node.js**: 18.0 或更高版本
- **内存**: 4GB RAM
- **存储**: 2GB 可用空间

### 推荐配置
- **操作系统**: Windows 11, macOS 12+, Ubuntu 20.04+
- **Python**: 3.11+
- **Node.js**: 20.0+
- **内存**: 8GB RAM
- **存储**: 5GB 可用空间

### 可选组件
- **Ollama**: 用于本地大模型问答（RAG功能）
  - 安装: https://ollama.com/
  - 模型: `ollama pull qwen2.5:3b`
- **uv**: Python包管理器（推荐）
  - 安装: `curl -LsSf https://astral.sh/uv/install.sh | sh`

## 🔧 安装指南

### 自动安装（推荐）
```bash
# 运行一键安装脚本
python install.py
```

### 分步安装

#### 1. 后端设置
```bash
# 运行后端初始化脚本
python scripts/setup_backend.py

# 或手动安装
uv sync
uv sync -E langchain  # 可选：安装LangChain功能
```

#### 2. 前端设置
```bash
# 运行前端初始化脚本
python scripts/setup_frontend.py

# 或手动安装
cd frontend
npm install
```

#### 3. 数据库初始化
```bash
# 运行数据库初始化脚本
python scripts/init_database.py

# 或手动初始化
sqlite3 hua_news.db < db/init_database.sql
```

### 环境配置

#### 后端环境变量 (.env)
```env
# 数据库配置
DATABASE_URL=sqlite:///./hua_news.db
SECRET_KEY=your-secret-key-here

# 服务配置
PORT=5050

# 采集配置
FETCH_TIMEOUT_SEC=8
FETCH_RETRIES=3
RATE_LIMIT_DOMAIN_QPS=1
ENABLE_ENRICH=true
ENABLE_EMBED=true
EMBED_BATCH_SIZE=64
CHUNK_SIZE=800
CHUNK_OVERLAP=120
SIMHASH_HAMMING_THRESHOLD=4

# 百度搜索API（可选）
BAIDU_API_KEY=
BAIDU_SECRET_KEY=

# 网络搜索配置
ENABLE_WEB_SEARCH=true
WEB_SEARCH_FALLBACK=true
```

#### 前端环境变量 (.env.local)
```env
# API基础URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050

# 应用配置
NEXT_PUBLIC_APP_NAME=华新AI知识库系统
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🚀 启动服务

### 开发环境

#### 启动后端服务
```bash
cd backend
python run.py
# 默认端口: 5050
# 健康检查: http://localhost:5050/api/health
```

#### 启动前端服务
```bash
cd frontend
npm run dev
# 默认端口: 3000
# 访问地址: http://localhost:3000
```

### 生产环境

#### 后端服务
```bash
# 使用Gunicorn（推荐）
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5050 core.app:create_app()

# 或使用uWSGI
pip install uwsgi
uwsgi --http :5050 --module core.app:create_app --callable app
```

#### 前端服务
```bash
cd frontend
# 构建生产版本
npm run build

# 启动生产服务
npm start
```

### 一键启动脚本
```bash
# Windows
startup_scripts/start_all.bat

# Linux/macOS
./startup_scripts/start_all.sh
```

## 📚 功能特性

### 🔍 智能搜索
- **语义搜索**: 基于向量相似度的智能检索
- **混合搜索**: 结合关键词和语义搜索
- **网络搜索**: 本地无结果时自动联网补充
- **引用溯源**: 搜索结果包含来源链接

### 📰 RSS采集管理
- **多源采集**: 支持多个RSS源同时采集
- **自动采集**: 定时自动采集，可配置采集间隔
- **手动采集**: 支持单源和批量手动采集
- **内容去重**: 基于SimHash的智能去重
- **状态监控**: 实时显示采集状态和进度

### 📚 知识库管理
- **文章管理**: 支持文章的增删改查
- **分类标签**: 灵活的文章分类和标签系统
- **批量操作**: 支持批量删除、导入等操作
- **内容编辑**: 行内编辑文章标签和分类
- **搜索筛选**: 多维度筛选和搜索

### 👥 用户权限管理
- **用户管理**: 完整的用户CRUD操作
- **角色权限**: 基于角色的权限控制系统
- **用户组**: 支持用户分组管理
- **活动日志**: 详细的用户操作日志
- **会话管理**: JWT令牌和会话管理

### 📧 邮件通知系统
- **采集通知**: RSS采集完成自动发送邮件
- **多收件人**: 支持多个收件人配置
- **邮件模板**: 可自定义邮件内容和格式
- **发送状态**: 详细的邮件发送状态反馈
- **重试机制**: 发送失败自动重试

### 🤖 AI智能功能
- **智能问答**: 基于知识库的问答系统
- **内容摘要**: 自动生成文章摘要
- **关键词提取**: 智能提取文章关键词
- **向量搜索**: 基于FAISS的高效向量检索
- **模型配置**: 支持多种AI模型配置

### 📊 数据分析
- **仪表盘**: 数据概览和统计信息
- **趋势分析**: 文章入库趋势分析
- **关键词统计**: 热门关键词分析
- **来源分析**: RSS源效果分析
- **可视化图表**: 直观的数据展示

## 🔌 API接口

### 接口文档
- **OpenAPI规范**: `openapi.yaml`
- **详细文档**: `doc/backend_api.md`
- **基准URL**: `http://localhost:5050`

### 核心API端点

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

#### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/{id}` - 更新用户
- `DELETE /api/users/{id}` - 删除用户
- `GET /api/user-roles` - 获取角色列表
- `GET /api/user-groups` - 获取用户组列表

#### RSS管理
- `GET /api/settings/rss` - 获取RSS源列表
- `POST /api/settings/rss` - 创建RSS源
- `PUT /api/settings/rss/{id}` - 更新RSS源
- `DELETE /api/settings/rss/{id}` - 删除RSS源
- `POST /api/settings/rss/ingest/{id}` - 手动采集
- `POST /api/settings/rss/ingest-all` - 批量采集

#### 知识库
- `GET /api/kb/items` - 获取文章列表
- `GET /api/kb/items/{id}` - 获取文章详情
- `PUT /api/kb/items/{id}` - 更新文章
- `DELETE /api/kb/items/{id}` - 删除文章
- `POST /api/kb/items/batch-delete` - 批量删除

#### 搜索功能
- `POST /api/search/semantic` - 语义搜索
- `POST /api/search/qa` - 智能问答

#### 系统设置
- `GET /api/settings` - 获取系统设置
- `PUT /api/settings` - 更新系统设置
- `GET /api/settings/models` - 获取模型配置
- `PUT /api/settings/models` - 更新模型配置
- `POST /api/email/test` - 测试邮件发送

#### 数据分析
- `GET /api/dashboard/summary` - 获取仪表盘数据
- `GET /api/analytics/keywords` - 获取关键词统计
- `GET /api/analytics/trends` - 获取趋势分析

### API测试
- **HTTP集合**: `tests/api.http` (VS Code REST Client)
- **冒烟测试**: `tests/smoke_test.py` (Python requests)
- **测试报告**: `tests/api_test_report.md`

## 📁 项目结构

```
hua_news_ai_rag/                    # 项目根目录
├── backend/                        # 后端模块
│   ├── core/                       # 核心应用层
│   │   └── app.py                  # Flask主应用入口
│   ├── data/                       # 数据层
│   │   ├── db.py                   # 数据库连接管理
│   │   ├── models.py               # 基础数据模型
│   │   ├── user_management_models.py # 用户管理模型
│   │   └── model_config_models.py  # 模型配置模型
│   ├── ai/                         # AI服务层
│   │   ├── embeddings.py           # 文本嵌入服务
│   │   ├── enrich.py               # 文本增强工具
│   │   ├── qa.py                   # 问答系统
│   │   └── vectorstore.py          # 向量搜索功能
│   ├── crawler/                    # 数据采集层
│   │   ├── fetcher.py              # HTTP抓取器
│   │   ├── ingest.py               # RSS采集处理
│   │   └── ingest_utils.py         # 采集工具
│   ├── routes/                     # API路由层
│   │   ├── auth.py                 # 认证端点
│   │   ├── users.py                # 用户管理端点
│   │   ├── rss.py                  # RSS管理端点
│   │   ├── kb.py                   # 知识库端点
│   │   ├── models_settings.py      # 模型配置端点
│   │   ├── settings.py             # 系统设置端点
│   │   ├── email_test.py           # 邮件测试端点
│   │   └── user_*.py               # 用户管理相关端点
│   ├── services/                   # 领域服务
│   │   ├── ai_summary.py           # AI摘要服务
│   │   ├── web_search.py           # 联网搜索服务
│   │   └── simple_web_search.py    # 简单搜索服务
│   ├── email_fly/                  # 邮件模块
│   │   ├── email_sender.py         # 邮件发送服务
│   │   ├── email_templates.py      # 邮件模板
│   │   └── db_email_sender.py      # 数据库邮件发送
│   ├── scripts/                    # 脚本工具
│   │   ├── export_openapi.py       # OpenAPI导出
│   │   └── migrate_*.py            # 数据库迁移脚本
│   ├── config.py                   # 应用配置
│   └── run.py                      # 服务启动文件
├── frontend/                       # 前端应用
│   ├── app/                        # Next.js应用目录
│   │   ├── page.tsx                # 首页
│   │   ├── login/                  # 登录页面
│   │   ├── kb/                     # 知识库页面
│   │   ├── search/                 # 搜索页面
│   │   ├── settings/               # 设置页面
│   │   │   ├── rss/                # RSS管理
│   │   │   ├── models/             # 模型配置
│   │   │   ├── system/             # 系统设置
│   │   │   └── users/              # 用户管理
│   │   └── analytics/              # 数据分析
│   ├── components/                 # 组件库
│   │   ├── UserManagement/         # 用户管理组件
│   │   ├── Nav.tsx                 # 导航组件
│   │   ├── Notification.tsx        # 通知组件
│   │   └── ContentModal.tsx        # 内容模态框
│   ├── lib/                        # 工具库
│   │   ├── api.ts                  # API客户端
│   │   ├── auth.ts                 # 认证工具
│   │   └── validators.ts           # 验证器
│   └── package.json                # 前端依赖配置
├── db/                             # 数据库相关
│   ├── init_database.sql           # 数据库初始化脚本
│   ├── schema.sql                  # 基础表结构
│   ├── seed.sql                    # 种子数据
│   └── user_management_schema.sql  # 用户管理表结构
├── scripts/                        # 安装脚本
│   ├── init_database.py            # 数据库初始化脚本
│   ├── setup_backend.py            # 后端设置脚本
│   └── setup_frontend.py           # 前端设置脚本
├── doc/                            # 项目文档
│   ├── backend_api.md              # API文档
│   ├── system_architecture_document.md # 系统架构文档
│   ├── product_requirements_document.md # 产品需求文档
│   └── user_management_design.md   # 用户管理设计文档
├── tests/                          # 测试文件
│   ├── api.http                    # HTTP测试集合
│   ├── smoke_test.py               # 冒烟测试
│   └── api_test_report.md          # 测试报告
├── snapshot/                       # 系统截图
├── install.py                      # 一键安装脚本
├── INSTALLATION.md                 # 详细安装指南
├── README_INSTALL.md               # 快速安装指南
├── pyproject.toml                  # Python项目配置
├── openapi.yaml                    # OpenAPI规范
└── hua_news.db                     # SQLite数据库文件
```

## 🛠️ 开发指南

### 开发环境设置
```bash
# 后端开发
cd backend
source ../.venv/bin/activate
python run.py

# 前端开发
cd frontend
npm run dev
```

### 代码格式化
```bash
# 后端代码格式化
pip install black isort flake8
black backend/
isort backend/
flake8 backend/

# 前端代码格式化
npm install -g prettier
prettier --write frontend/
```

### 测试
```bash
# 后端测试
cd backend
python -m pytest

# 前端测试
cd frontend
npm test
```

### 调试
```bash
# 后端调试
cd backend
python -m pdb run.py

# 前端调试
cd frontend
npm run dev -- --inspect
```

## ❓ 常见问题

### 🔌 连接问题
**Q: 前端报错无法访问API**
- 确认 `NEXT_PUBLIC_API_BASE_URL` 指向后端实际地址
- 默认配置：前端 `http://localhost:3000` ↔ 后端 `http://localhost:5050`
- 如需要，可在 `frontend/.env.local` 中设置：`NEXT_PUBLIC_API_BASE_URL=http://localhost:5050`

**Q: 端口冲突**
- 检查端口占用：`lsof -i :5050` 和 `lsof -i :3000`
- 修改后端端口：`PORT=8080 python run.py`

### 🐍 Python相关问题
**Q: 导入错误 (ImportError)**
- 运行修复脚本：`cd backend && python fix_imports.py`
- 确保使用正确的启动方式：`python run.py`

**Q: 虚拟环境问题**
- 确保激活虚拟环境：`source .venv/bin/activate`
- 检查Python版本：`python --version` (建议3.11+)

### 🗄️ 数据库问题
**Q: 数据库连接失败**
- 确认 `hua_news.db` 文件路径正确
- 检查 `backend/config.py` 中的 `database_url` 配置
- 默认路径：项目根目录的 `hua_news.db`

**Q: 表不存在错误**
- 首次启动会自动创建表结构
- 手动检查：`sqlite3 hua_news.db ".tables"`

### 🤖 AI功能问题
**Q: RAG/QA无法使用**
- 执行：`uv sync -E langchain`
- 确保本机有可用的LLM服务（例如Ollama）
- 拉取模型：`ollama pull qwen2.5:3b`

**Q: 向量搜索失败**
- 检查FAISS索引是否正确创建
- 确认文本嵌入服务正常运行
- 查看后端日志中的错误信息

### 🚀 启动问题
**Q: 后端启动失败**
- 检查依赖是否安装完整：`uv sync`
- 确认端口未被占用
- 查看错误日志

**Q: 前端启动失败**
- 检查Node.js版本：`node --version` (建议18+)
- 重新安装依赖：`cd frontend && rm -rf node_modules && npm install`
- 清除缓存：`npm run dev -- --clear`

### 📧 邮件问题
**Q: 邮件发送失败**
- 检查邮件配置：系统设置 → 邮件设置
- 验证SMTP设置和认证信息
- 查看邮件发送日志

**Q: 邮件通知不工作**
- 确认邮件模块已启用
- 检查收件人邮箱配置
- 验证RSS采集是否正常

## 📖 相关文档

### 安装部署
- [详细安装指南](INSTALLATION.md) - 完整的安装和配置说明
- [快速安装指南](README_INSTALL.md) - 快速上手指南

### 技术文档
- [API接口文档](doc/backend_api.md) - 完整的后端API文档
- [系统架构文档](doc/system_architecture_document.md) - 系统架构设计
- [产品需求文档](doc/product_requirements_document.md) - 产品功能需求
- [用户管理设计](doc/user_management_design.md) - 用户权限系统设计

### 开发文档
- [数据采集技术文档](doc/data_collection_technical_doc.md) - RSS采集技术实现
- [系统架构代码配置](doc/system_architecture_code_and_config.md) - 代码架构说明

### 测试文档
- [API测试报告](tests/api_test_report.md) - 接口测试结果
- [HTTP测试集合](tests/api.http) - VS Code REST Client测试

---

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

---

**⚠️ 重要提醒**: 安装完成后请及时修改默认密码并配置生产环境设置！
