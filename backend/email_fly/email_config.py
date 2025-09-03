#!/usr/bin/env python3
"""
邮件配置模块
用于采集后自动发送邮件通知
"""

# ==================== 邮件功能总开关 ====================
# 设置为 False 可以完全禁用邮件功能，避免任何邮件相关的错误
ENABLE_EMAIL_MODULE = False

# 收件人列表（支持多个邮箱，用逗号分隔）
RECIPIENT_EMAILS = [
    "user1@example.com",      # 用户1
    # "user2@example.com",      # 用户2
    # 可以继续添加更多收件人
]

# ==================== 发送邮件的服务商选择====================
# 选择你的邮件服务商，取消注释对应的配置块

EMAIL_PROVIDER = "163"  # 可选: gmail, qq, 163, outlook, yahoo, sina, custom





# ==================== 邮件服务商配置 ====================
# 选择你的邮件服务商，取消注释对应的配置块



GMAIL_CONFIG = {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "your-email@gmail.com",  # 替换为你的Gmail邮箱
    "smtp_password": "your-app-password",     # 替换为你的应用专用密码
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}

# QQ邮箱配置
QQ_CONFIG = {
    "smtp_host": "smtp.qq.com",
    "smtp_port": 587,
    "smtp_username": "your-email@qq.com",    # 替换为你的QQ邮箱
    "smtp_password": "your-authorization-code", # 替换为你的授权码
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}

# 163邮箱配置
EMAIL_163_CONFIG = {
    "smtp_host": "smtp.163.com",
    "smtp_port": 465,
    "smtp_username": "@163.com",   # 替换为你的163邮箱
    "smtp_password": "", # 替换为你的授权码
    "smtp_use_tls": False,
    "smtp_use_ssl": True
}

# Outlook配置
OUTLOOK_CONFIG = {
    "smtp_host": "smtp-mail.outlook.com",
    "smtp_port": 587,
    "smtp_username": "your-email@outlook.com", # 替换为你的Outlook邮箱
    "smtp_password": "your-password",          # 替换为你的密码
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}

# Yahoo配置
YAHOO_CONFIG = {
    "smtp_host": "smtp.mail.yahoo.com",
    "smtp_port": 587,
    "smtp_username": "your-email@yahoo.com",  # 替换为你的Yahoo邮箱
    "smtp_password": "your-app-password",     # 替换为你的应用专用密码
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}

# 新浪邮箱配置
SINA_CONFIG = {
    "smtp_host": "smtp.sina.com",
    "smtp_port": 25,
    "smtp_username": "your-email@sina.com",   # 替换为你的新浪邮箱
    "smtp_password": "your-authorization-code", # 替换为你的授权码
    "smtp_use_tls": False,
    "smtp_use_ssl": False
}

# 自定义SMTP配置
CUSTOM_CONFIG = {
    "smtp_host": "smtp.your-server.com",      # 替换为你的SMTP服务器
    "smtp_port": 587,
    "smtp_username": "your-email@domain.com", # 替换为你的邮箱
    "smtp_password": "your-password",         # 替换为你的密码
    "smtp_use_tls": True,
    "smtp_use_ssl": False
}

# ==================== 邮件通知配置 ====================
# 是否启用邮件通知
ENABLE_EMAIL_NOTIFICATION = True

# 发件人显示名称
SENDER_NAME = "华新AI知识库系统"



# 每次邮件最多包含的文章数量
MAX_ARTICLES_IN_EMAIL = 10

# 邮件模板语言 (zh_cn 或 en)
EMAIL_TEMPLATE_LANGUAGE = "zh_cn"

# 邮件格式 (html 或 markdown)
EMAIL_FORMAT = "markdown"

# 邮件发送超时时间（秒）
EMAIL_SEND_TIMEOUT = 30

# 邮件发送重试次数
EMAIL_RETRY_COUNT = 3

# 邮件发送重试延迟（秒）
EMAIL_RETRY_DELAY = 5

# ==================== 使用说明 ====================
"""
使用步骤：
1. 设置邮件功能总开关：ENABLE_EMAIL_MODULE = True/False
   - True: 启用邮件功能
   - False: 完全禁用邮件功能，避免任何邮件相关的错误
2. 选择邮件服务商，设置 EMAIL_PROVIDER 变量
3. 在对应配置块中填入你的邮箱和密码/授权码
4. 在 RECIPIENT_EMAILS 中添加收件人邮箱
5. 设置 SENDER_NAME 为你的发件人名称
6. 选择邮件格式：EMAIL_FORMAT = "html" 或 "markdown"
7. 重启后端服务

邮件功能开关说明：
- ENABLE_EMAIL_MODULE: 总开关，控制整个邮件模块是否启用
- ENABLE_EMAIL_NOTIFICATION: 细粒度开关，控制是否发送通知邮件
- 当 ENABLE_EMAIL_MODULE = False 时，所有邮件功能都将被禁用
- 当 ENABLE_EMAIL_MODULE = True 且 ENABLE_EMAIL_NOTIFICATION = False 时，模块可用但不发送邮件

邮件格式说明：
- HTML格式：传统的HTML邮件，样式丰富，兼容性好
- Markdown格式：使用Markdown语法编写，自动转换为HTML显示
  * 支持标题、粗体、链接、列表等Markdown语法
  * 自动添加美观的CSS样式
  * 便于编辑和维护

注意事项：
- Gmail需要使用应用专用密码，不是登录密码
- QQ邮箱、163邮箱等需要使用授权码，不是登录密码
- 确保邮箱开启了SMTP服务
- 如果使用企业邮箱，请联系IT部门获取SMTP配置
- Markdown格式会自动转换为HTML，确保邮件客户端兼容性
- 如果遇到邮件相关错误，可以设置 ENABLE_EMAIL_MODULE = False 来完全禁用邮件功能
"""
