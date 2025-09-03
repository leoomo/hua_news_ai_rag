# 🚀 邮件模块快速设置指南

## 📧 邮件功能开关

邮件模块提供了两个级别的开关控制：

### 1. 总开关 (ENABLE_EMAIL_MODULE)
```python
# 在 email_config.py 中设置
ENABLE_EMAIL_MODULE = True   # True: 启用邮件功能, False: 完全禁用
```

- **True**: 启用邮件模块，可以进行邮件配置和发送
- **False**: 完全禁用邮件模块，避免任何邮件相关的错误
- 适用于：不需要邮件功能或遇到邮件配置问题的环境

### 2. 通知开关 (ENABLE_EMAIL_NOTIFICATION)
```python
# 在 email_config.py 中设置
ENABLE_EMAIL_NOTIFICATION = True   # True: 发送邮件, False: 不发送
```

- **True**: 采集完成后自动发送邮件通知
- **False**: 邮件模块可用但不发送邮件
- 适用于：测试环境或临时禁用邮件发送

### 开关组合效果
| ENABLE_EMAIL_MODULE | ENABLE_EMAIL_NOTIFICATION | 效果 |
|---------------------|---------------------------|------|
| False | 任意值 | 🚫 邮件功能完全禁用 |
| True | False | ⚠️ 模块可用但不发送邮件 |
| True | True | 🎯 邮件功能完全启用 |

## 5分钟快速配置

### 步骤1: 复制配置文件
```bash
cd backend/email_fly
cp email_config_example.py email_config.py
```

### 步骤2: 编辑配置文件
编辑 `email_config.py` 文件，主要修改以下内容：

1. **选择邮件服务商**:
   ```python
   EMAIL_PROVIDER = "qq"  # 改为你使用的邮箱服务商
   ```

2. **填入邮箱信息**:
   ```python
   QQ_CONFIG = {
       "smtp_username": "your-email@qq.com",    # 改为你的QQ邮箱
       "smtp_password": "your-authorization-code", # 改为你的授权码
       # 其他配置保持默认
   }
   ```

3. **设置收件人**:
   ```python
   RECIPIENT_EMAILS = [
       "admin@yourcompany.com",      # 改为实际收件人邮箱
       "user1@yourcompany.com",      # 可以添加多个
   ]
   ```

4. **自定义发件人名称**:
   ```python
   SENDER_NAME = "你的系统名称"  # 改为你想要的发件人名称
   ```

### 步骤3: 测试配置
```bash
cd backend/email_fly
python test_email.py
```

### 步骤4: 重启后端服务
```bash
cd backend
python run.py
```

## 常用邮箱配置示例

### Gmail
```python
EMAIL_PROVIDER = "gmail"
GMAIL_CONFIG = {
    "smtp_username": "your-email@gmail.com",
    "smtp_password": "your-app-password",  # 应用专用密码，不是登录密码
}
```

### QQ邮箱
```python
EMAIL_PROVIDER = "qq"
QQ_CONFIG = {
    "smtp_username": "your-email@qq.com",
    "smtp_password": "your-authorization-code",  # 授权码，不是登录密码
}
```

### 163邮箱
```python
EMAIL_PROVIDER = "163"
EMAIL_163_CONFIG = {
    "smtp_username": "your-email@163.com",
    "smtp_password": "your-authorization-code",  # 授权码，不是登录密码
}
```

## 获取授权码/应用密码

### Gmail
1. 开启两步验证
2. 生成应用专用密码
3. 使用应用专用密码而不是登录密码

### QQ邮箱
1. 登录QQ邮箱网页版
2. 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
3. 开启SMTP服务，获取授权码

### 163邮箱
1. 登录163邮箱网页版
2. 设置 → POP3/SMTP/IMAP
3. 开启SMTP服务，获取授权码

## 验证配置

配置完成后，系统会在RSS采集时自动发送邮件通知。你可以：

1. 手动触发RSS采集
2. 检查收件箱是否收到通知邮件
3. 查看后端日志中的邮件发送记录

## 常见问题

### Q: 邮件发送失败怎么办？
A: 检查以下几点：
- 邮箱地址和密码/授权码是否正确
- 是否开启了SMTP服务
- 网络连接是否正常
- 查看后端日志中的错误信息

### Q: 如何禁用邮件通知？
A: 在 `email_config.py` 中设置：
```python
ENABLE_EMAIL_NOTIFICATION = False
```

### Q: 如何完全禁用邮件模块？
A: 在 `email_config.py` 中设置：
```python
ENABLE_EMAIL_MODULE = False
```
这样可以避免任何邮件相关的错误，适用于不需要邮件功能的环境。

### Q: 遇到邮件配置错误怎么办？
A: 如果遇到邮件相关的导入错误或配置问题，可以：
1. 设置 `ENABLE_EMAIL_MODULE = False` 来完全禁用邮件功能
2. 检查邮箱配置是否正确
3. 查看后端日志中的具体错误信息

### Q: 如何修改邮件模板语言？
A: 在 `email_config.py` 中设置：
```python
EMAIL_TEMPLATE_LANGUAGE = "en"  # 改为英文
```

### Q: 如何调整邮件发送频率？
A: 邮件发送频率与RSS采集频率一致，可以在RSS源设置中调整采集间隔。

## 高级配置

### 自定义SMTP服务器
```python
EMAIL_PROVIDER = "custom"
CUSTOM_CONFIG = {
    "smtp_host": "smtp.your-server.com",
    "smtp_port": 587,
    "smtp_username": "your-email@domain.com",
    "smtp_password": "your-password",
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}
```

### 调整邮件参数
```python
# 每次邮件最多包含的文章数量
MAX_ARTICLES_IN_EMAIL = 20

# 邮件发送超时时间
EMAIL_SEND_TIMEOUT = 60

# 重试次数
EMAIL_RETRY_COUNT = 5
```

## 完成！

配置完成后，每当RSS采集到新文章时，系统会自动发送美观的HTML邮件通知给所有收件人，包含文章摘要、来源、分类等信息。
