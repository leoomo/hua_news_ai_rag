# 华新AI知识库系统 - 安装指南

## 📋 目录

- [系统要求](#系统要求)
- [快速安装](#快速安装)
- [详细安装步骤](#详细安装步骤)
- [配置说明](#配置说明)
- [启动服务](#启动服务)
- [验证安装](#验证安装)
- [常见问题](#常见问题)
- [开发环境设置](#开发环境设置)

---

## 🖥️ 系统要求

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

---

## 🚀 快速安装

### 一键安装脚本

```bash
# 克隆项目
git clone https://github.com/leoomo/hua_news_ai_rag.git
cd hua_news_ai_rag

# 运行自动安装脚本
python scripts/setup_backend.py
python scripts/setup_frontend.py
python scripts/init_database.py

# 启动服务
cd backend && python run.py &
cd frontend && npm run dev
```

### 访问系统
- 前端界面: http://localhost:3000
- 后端API: http://localhost:5050
- 默认账户: admin / admin123

---

## 📝 详细安装步骤

### 1. 环境准备

#### 安装Python 3.11+
```bash
# Windows (使用Chocolatey)
choco install python311

# macOS (使用Homebrew)
brew install python@3.11

# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-pip

# 验证安装
python --version
```

#### 安装Node.js 18+
```bash
# Windows (使用Chocolatey)
choco install nodejs

# macOS (使用Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 获取项目代码

```bash
# 克隆项目
git clone https://github.com/leoomo/hua_news_ai_rag.git
cd hua_news_ai_rag

# 或下载ZIP文件并解压
```

### 3. 后端设置

#### 自动安装（推荐）
```bash
python scripts/setup_backend.py
```

#### 手动安装
```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 安装依赖
pip install -e .

# 创建环境变量文件
cp .env.example .env
```

### 4. 前端设置

#### 自动安装（推荐）
```bash
python scripts/setup_frontend.py
```

#### 手动安装
```bash
cd frontend

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env.local
```

### 5. 数据库初始化

#### 自动初始化（推荐）
```bash
python scripts/init_database.py
```

#### 手动初始化
```bash
# 使用SQLite命令行工具
sqlite3 hua_news.db < db/init_database.sql
```

---

## ⚙️ 配置说明

### 后端配置 (.env)

```env
# 数据库配置
DATABASE_URL=sqlite:///./hua_news.db

# 安全配置
SECRET_KEY=your-secret-key-here-change-in-production

# 数据库连接池配置
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=60
DB_POOL_RECYCLE=3600

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

# 百度搜索API配置（可选）
BAIDU_API_KEY=
BAIDU_SECRET_KEY=

# 网络搜索配置
ENABLE_WEB_SEARCH=true
WEB_SEARCH_FALLBACK=true

# 服务端口配置
PORT=5050
```

### 前端配置 (.env.local)

```env
# API基础URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050

# 应用配置
NEXT_PUBLIC_APP_NAME=华新AI知识库系统
NEXT_PUBLIC_APP_VERSION=1.0.0

# 开发配置
NODE_ENV=development
```

---

## 🚀 启动服务

### 开发环境

#### 启动后端服务
```bash
cd backend
python run.py
```

#### 启动前端服务
```bash
cd frontend
npm run dev
```

### 生产环境

#### 后端服务
```bash
cd backend
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

### 使用Docker（可选）

```bash
# 构建镜像
docker build -t hua-news-ai-rag .

# 运行容器
docker run -p 3000:3000 -p 5050:5050 hua-news-ai-rag
```

---

## ✅ 验证安装

### 1. 检查后端服务
```bash
# 健康检查
curl http://localhost:5050/api/health

# 预期响应
{"status": "ok"}
```

### 2. 检查前端服务
- 访问: http://localhost:3000
- 应该看到登录页面

### 3. 测试登录
- 用户名: `admin`
- 密码: `admin123`

### 4. 检查数据库
```bash
# 使用SQLite命令行
sqlite3 hua_news.db

# 查看表
.tables

# 查看用户
SELECT username, email, role FROM users;

# 退出
.quit
```

---

## 🔧 常见问题

### Q1: Python版本问题
**问题**: `Python 3.11 is required`
**解决**: 安装Python 3.11或更高版本

### Q2: Node.js版本问题
**问题**: `Node.js 18 is required`
**解决**: 安装Node.js 18或更高版本

### Q3: 端口占用
**问题**: `Port 5050 is already in use`
**解决**: 
```bash
# 查找占用端口的进程
lsof -i :5050  # macOS/Linux
netstat -ano | findstr :5050  # Windows

# 杀死进程或修改端口
```

### Q4: 数据库连接失败
**问题**: `Database connection failed`
**解决**: 
1. 检查数据库文件权限
2. 确保数据库初始化完成
3. 检查DATABASE_URL配置

### Q5: 前端构建失败
**问题**: `Build failed`
**解决**: 
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Q6: 邮件发送失败
**问题**: `Email sending failed`
**解决**: 
1. 检查邮件配置
2. 验证SMTP设置
3. 检查网络连接

---

## 🛠️ 开发环境设置

### 代码格式化
```bash
# 后端
pip install black isort flake8
black backend/
isort backend/
flake8 backend/

# 前端
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

---

## 📚 相关文档

- [API文档](doc/backend_api.md)
- [系统架构](doc/system_architecture_document.md)
- [产品需求](doc/product_requirements_document.md)
- [用户管理设计](doc/user_management_design.md)

---

## 🆘 获取帮助

如果遇到问题，请：

1. 查看本文档的常见问题部分
2. 检查项目的GitHub Issues
3. 联系开发团队

---

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

---

**安装完成后，请及时修改默认密码并配置生产环境设置！**
