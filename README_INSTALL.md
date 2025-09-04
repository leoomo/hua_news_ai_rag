# 华新AI知识库系统 - 快速安装指南

## 🚀 一键安装

```bash
# 克隆项目
git clone https://github.com/leoomo/hua_news_ai_rag.git
cd hua_news_ai_rag

# 运行一键安装脚本
python install.py
```

## 📋 系统要求

- **Python**: 3.11+
- **Node.js**: 18+
- **内存**: 4GB+
- **存储**: 2GB+

## 🔧 手动安装

### 1. 后端设置
```bash
python scripts/setup_backend.py
```

### 2. 前端设置
```bash
python scripts/setup_frontend.py
```

### 3. 数据库初始化
```bash
python scripts/init_database.py
```

## 🚀 启动服务

### 自动启动
```bash
# Windows
startup_scripts/start_all.bat

# Linux/macOS
./startup_scripts/start_all.sh
```

### 手动启动
```bash
# 启动后端
cd backend && python run.py

# 启动前端
cd frontend && npm run dev
```

## 🌐 访问系统

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:5050
- **默认账户**: admin / admin123

## 📚 详细文档

- [完整安装指南](INSTALLATION.md)
- [API文档](doc/backend_api.md)
- [系统架构](doc/system_architecture_document.md)

## ⚠️ 重要提醒

1. **修改默认密码**: 安装完成后请立即修改默认密码
2. **生产环境配置**: 部署到生产环境时请修改SECRET_KEY
3. **邮件配置**: 配置邮件服务以启用通知功能

## 🆘 获取帮助

如果遇到问题，请查看：
1. [常见问题](INSTALLATION.md#常见问题)
2. 项目的GitHub Issues
3. 联系开发团队
