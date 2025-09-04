"""
邮件测试API端点
"""

from flask import Blueprint, request, current_app
import logging
from data.db import get_db_session
from data.models import EmailConfig
from email_fly.email_sender import get_email_sender

email_test_bp = Blueprint('email_test', __name__)

@email_test_bp.post('/email/test')
def test_email_sending():
    """测试邮件发送功能"""
    try:
        # 重新初始化邮件发送器以确保数据库连接正确
        from email_fly.email_sender import EmailSender
        email_sender = EmailSender()
        
        if not email_sender.enabled:
            return {
                'code': 400, 
                'msg': '邮件模块未启用',
                'data': {
                    'enabled': False,
                    'message': '邮件模块未启用或配置未找到'
                }
            }, 400
        
        # 创建测试文章数据
        test_articles = [
            {
                "title": "测试文章1 - 邮件发送功能测试",
                "url": "https://example.com/test1",
                "summary": "这是一篇测试文章，用于验证邮件发送功能是否正常工作。",
                "source": "测试源",
                "published_at": "2025-09-04T10:00:00Z"
            },
            {
                "title": "测试文章2 - 系统功能验证",
                "url": "https://example.com/test2", 
                "summary": "第二篇测试文章，确保邮件内容格式正确显示。",
                "source": "测试源",
                "published_at": "2025-09-04T10:05:00Z"
            }
        ]
        
        # 发送测试邮件
        result = email_sender.send_notification_with_details(test_articles)
        
        return {
            'code': 0,
            'msg': '邮件测试完成',
            'data': {
                'success': result['success'],
                'success_count': result['success_count'],
                'total_count': result['total_count'],
                'send_time': result['send_time'],
                'message': result['message'],
                'failure_reason': result.get('failure_reason', ''),
                'errors': result.get('errors', []),
                'recipients': email_sender.recipients,
                'sender': f"{email_sender.sender_name} <{email_sender.sender_email}>"
            }
        }
        
    except Exception as e:
        logging.error(f"邮件测试失败: {e}")
        return {
            'code': 500,
            'msg': f'邮件测试失败: {str(e)}',
            'data': {
                'success': False,
                'error': str(e)
            }
        }, 500

@email_test_bp.get('/email/config')
def get_email_config():
    """获取邮件配置信息"""
    try:
        with get_db_session() as session:
            config = session.query(EmailConfig).first()
            if not config:
                return {
                    'code': 404,
                    'msg': '邮件配置未找到',
                    'data': None
                }, 404
            
            return {
                'code': 0,
                'msg': '获取邮件配置成功',
                'data': {
                    'enable_email_module': config.enable_email_module,
                    'enable_email_notification': config.enable_email_notification,
                    'recipient_emails': config.recipient_emails,
                    'sender_name': config.sender_name,
                    'sender_email': config.sender_email,
                    'email_provider': config.email_provider,
                    'custom_smtp_config': config.custom_smtp_config,
                    'email_format': config.email_format,
                    'email_template_language': config.email_template_language,
                    'max_articles_in_email': config.max_articles_in_email,
                    'email_send_timeout': config.email_send_timeout,
                    'email_retry_count': config.email_retry_count,
                    'email_retry_delay': config.email_retry_delay
                }
            }
    except Exception as e:
        logging.error(f"获取邮件配置失败: {e}")
        return {
            'code': 500,
            'msg': f'获取邮件配置失败: {str(e)}',
            'data': None
        }, 500
