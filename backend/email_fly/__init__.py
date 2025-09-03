# 邮件模块初始化
from .email_sender import EmailSender, send_rss_ingest_notification, test_email_configuration

__all__ = [
    'EmailSender',
    'send_rss_ingest_notification', 
    'test_email_configuration'
]
