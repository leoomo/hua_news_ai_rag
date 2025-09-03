# 📧 邮件模块使用说明

## 概述

邮件模块用于在RSS采集完成后自动发送通知邮件给多个收件人，支持多种邮件服务商，配置简单，无需环境变量。

## 功能特点

- ✅ **多服务商支持**: Gmail、QQ邮箱、163邮箱、Outlook、Yahoo、新浪邮箱、自定义SMTP
- ✅ **多收件人**: 支持同时发送给多个邮箱地址
- ✅ **HTML邮件**: 美观的HTML格式邮件，包含文章摘要和链接
- ✅ **中英文支持**: 支持中文和英文邮件模板
- ✅ **重试机制**: 自动重试失败的邮件发送
- ✅ **配置简单**: 所有配置集中在一个文件中

## 快速配置

### 1. 选择邮件服务商

编辑 `email_config.py` 文件，设置 `EMAIL_PROVIDER` 变量：

```python
# 选择你的邮件服务商
EMAIL_PROVIDER = "gmail"  # 可选: gmail, qq, 163, outlook, yahoo, sina, custom
```

### 2. 配置邮箱信息

在对应的配置块中填入你的邮箱和密码/授权码：

```python
# Gmail 配置示例
GMAIL_CONFIG = {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "your-email@gmail.com",  # 替换为你的Gmail邮箱
    "smtp_password": "your-app-password",     # 替换为你的应用专用密码
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}
```

### 3. 设置收件人

在 `RECIPIENT_EMAILS` 列表中添加收件人邮箱：

```python
RECIPIENT_EMAILS = [
    "admin@example.com",      # 管理员
    "user1@example.com",      # 用户1
    "user2@example.com",      # 用户2
    # 可以继续添加更多收件人
]
```

### 4. 自定义发件人名称

```python
SENDER_NAME = "华新AI知识库系统"  # 自定义发件人显示名称
```

## 支持的邮件服务商

| 服务商 | SMTP服务器 | 端口 | 加密方式 | 说明 |
|--------|------------|------|----------|------|
| Gmail | smtp.gmail.com | 587 | TLS | 需要应用专用密码 |
| QQ邮箱 | smtp.qq.com | 587 | TLS | 需要授权码 |
| 163邮箱 | smtp.163.com | 25 | 无 | 需要授权码 |
| Outlook | smtp-mail.outlook.com | 587 | TLS | 使用登录密码 |
| Yahoo | smtp.mail.yahoo.com | 587 | TLS | 需要应用专用密码 |
| 新浪邮箱 | smtp.sina.com | 25 | 无 | 需要授权码 |
| 自定义 | 自定义 | 自定义 | 自定义 | 企业邮箱等 |

## 重要说明

### 密码/授权码获取

- **Gmail**: 需要在Google账户设置中开启两步验证，然后生成应用专用密码
- **QQ邮箱**: 在QQ邮箱设置中开启SMTP服务，获取授权码
- **163邮箱**: 在163邮箱设置中开启SMTP服务，获取授权码
- **Outlook**: 直接使用登录密码
- **Yahoo**: 需要在Yahoo账户设置中生成应用专用密码

### 安全建议

1. 不要在代码中硬编码真实的密码，建议使用环境变量或配置文件
2. 定期更换邮箱密码和授权码
3. 限制SMTP访问IP范围（如果可能）

## 使用方法

### 1. 在采集完成后发送邮件

```python
from backend.email import send_rss_ingest_notification

# 采集完成后调用
articles = [
    {
        "title": "文章标题",
        "summary": "文章摘要",
        "source": "来源",
        "url": "链接",
        "category": "分类",
        "created_at": "创建时间"
    }
]

# 发送通知邮件
success = send_rss_ingest_notification(articles)
if success:
    print("邮件发送成功")
else:
    print("邮件发送失败")
```

### 2. 测试邮件配置

```bash
cd backend/email
python test_email.py
```

### 3. 手动发送邮件

```python
from backend.email import EmailSender

sender = EmailSender()
success = sender.send_notification(articles)
```

## 配置选项

### 基本配置

```python
# 是否启用邮件通知
ENABLE_EMAIL_NOTIFICATION = True

# 每次邮件最多包含的文章数量
MAX_ARTICLES_IN_EMAIL = 10

# 邮件模板语言 (zh_cn 或 en)
EMAIL_TEMPLATE_LANGUAGE = "zh_cn"

# 邮件发送超时时间（秒）
EMAIL_SEND_TIMEOUT = 30

# 邮件发送重试次数
EMAIL_RETRY_COUNT = 3

# 邮件发送重试延迟（秒）
EMAIL_RETRY_DELAY = 5
```

## 邮件模板

### 中文模板

邮件包含以下信息：
- 采集时间和文章数量
- 每篇文章的标题、摘要、来源、分类、时间、链接
- 美观的HTML样式
- 系统信息页脚

### 英文模板

与中文模板类似，但使用英文显示。

## 故障排除

### 常见问题

1. **连接失败**
   - 检查SMTP服务器地址和端口是否正确
   - 确认网络连接正常
   - 检查防火墙设置

2. **认证失败**
   - 确认用户名和密码/授权码正确
   - 检查是否开启了SMTP服务
   - 确认邮箱支持SMTP访问

3. **邮件发送失败**
   - 检查收件人邮箱地址是否正确
   - 确认发件人邮箱有发送权限
   - 查看错误日志获取详细信息

### 调试方法

1. 使用测试脚本验证配置
2. 检查后端日志中的邮件相关错误
3. 确认邮件服务商的状态

## 集成到系统

邮件模块已经集成到RSS采集流程中，当采集完成后会自动发送通知邮件。如果需要修改触发条件或邮件内容，可以编辑相关的业务逻辑代码。

## 更新日志

- v1.0.0: 初始版本，支持基本邮件发送功能
- 支持多种邮件服务商
- 支持多收件人
- 支持HTML邮件模板
- 支持中英文
- 支持重试机制
