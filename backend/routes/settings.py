from flask import Blueprint, request, jsonify
import json
from datetime import datetime
from data.db import get_db_session
from data.models import EmailConfig

bp = Blueprint('settings', __name__)

@bp.route('/email', methods=['GET'])
def get_email_config():
    """获取邮件配置"""
    try:
        with get_db_session() as session:
            config = session.query(EmailConfig).first()
            
            if not config:
                # 如果没有配置，返回默认配置
                default_config = {
                    'enable_email_module': False,
                    'enable_email_notification': True,
                    'recipient_emails': [],
                    'sender_name': '华新AI知识库系统',
                    'sender_email': '',
                    'sender_password': '',
                    'email_provider': '163',
                    'custom_smtp_config': {
                        'smtp_host': 'smtp.your-server.com',
                        'smtp_port': 587,
                        'smtp_use_tls': True,
                        'smtp_use_ssl': False
                    },
                    'max_articles_in_email': 10,
                    'email_template_language': 'zh_cn',
                    'email_format': 'markdown',
                    'email_send_timeout': 30,
                    'email_retry_count': 3,
                    'email_retry_delay': 5,
                }
            else:
                # 从数据库读取配置
                default_config = {
                    'enable_email_module': config.enable_email_module,
                    'enable_email_notification': config.enable_email_notification,
                    'recipient_emails': config.recipient_emails if config.recipient_emails else [],
                    'sender_name': config.sender_name,
                    'sender_email': config.sender_email,
                    'sender_password': config.sender_password,
                    'email_provider': config.email_provider,
                    'custom_smtp_config': config.custom_smtp_config if config.custom_smtp_config else {
                        'smtp_host': 'smtp.your-server.com',
                        'smtp_port': 587,
                        'smtp_use_tls': True,
                        'smtp_use_ssl': False
                    },
                    'max_articles_in_email': config.max_articles_in_email,
                    'email_template_language': config.email_template_language,
                    'email_format': config.email_format,
                    'email_send_timeout': config.email_send_timeout,
                    'email_retry_count': config.email_retry_count,
                    'email_retry_delay': config.email_retry_delay,
                }
        
        return jsonify({
            'code': 0,
            'data': default_config,
            'message': '获取邮件配置成功'
        })
    except Exception as e:
        return jsonify({
            'code': 1,
            'message': f'获取邮件配置失败: {str(e)}'
        }), 500

@bp.route('/email', methods=['POST'])
def update_email_config():
    """更新邮件配置"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'code': 1,
                'message': '请求数据不能为空'
            }), 400

        # 验证必需字段
        required_fields = [
            'enable_email_module', 'enable_email_notification', 'recipient_emails',
            'sender_name', 'sender_email', 'sender_password', 'email_provider',
            'max_articles_in_email', 'email_template_language',
            'email_format', 'email_send_timeout', 'email_retry_count', 'email_retry_delay'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'code': 1,
                    'message': f'缺少必需字段: {field}'
                }), 400

        # 验证数据类型和范围
        if not isinstance(data['enable_email_module'], bool):
            return jsonify({
                'code': 1,
                'message': 'enable_email_module 必须是布尔值'
            }), 400

        if not isinstance(data['enable_email_notification'], bool):
            return jsonify({
                'code': 1,
                'message': 'enable_email_notification 必须是布尔值'
            }), 400

        if not isinstance(data['recipient_emails'], list):
            return jsonify({
                'code': 1,
                'message': 'recipient_emails 必须是数组'
            }), 400

        if not isinstance(data['sender_name'], str) or not data['sender_name'].strip():
            return jsonify({
                'code': 1,
                'message': 'sender_name 不能为空'
            }), 400

        if not isinstance(data['sender_email'], str) or not data['sender_email'].strip():
            return jsonify({
                'code': 1,
                'message': 'sender_email 不能为空'
            }), 400

        if not isinstance(data['sender_password'], str) or not data['sender_password'].strip():
            return jsonify({
                'code': 1,
                'message': 'sender_password 不能为空'
            }), 400

        if data['email_provider'] not in ['gmail', 'qq', '163', 'outlook', 'yahoo', 'sina', 'custom']:
            return jsonify({
                'code': 1,
                'message': 'email_provider 必须是有效的邮件服务商'
            }), 400

        if data['email_provider'] == 'custom':
            if not isinstance(data.get('custom_smtp_config'), dict):
                return jsonify({
                    'code': 1,
                    'message': 'custom_smtp_config 必须是对象'
                }), 400

        if not isinstance(data['max_articles_in_email'], int) or data['max_articles_in_email'] < 1:
            return jsonify({
                'code': 1,
                'message': 'max_articles_in_email 必须是大于0的整数'
            }), 400

        if data['email_template_language'] not in ['zh_cn', 'en']:
            return jsonify({
                'code': 1,
                'message': 'email_template_language 必须是 zh_cn 或 en'
            }), 400

        if data['email_format'] not in ['html', 'markdown']:
            return jsonify({
                'code': 1,
                'message': 'email_format 必须是 html 或 markdown'
            }), 400

        if not isinstance(data['email_send_timeout'], int) or data['email_send_timeout'] < 10:
            return jsonify({
                'code': 1,
                'message': 'email_send_timeout 必须是大于等于10的整数'
            }), 400

        if not isinstance(data['email_retry_count'], int) or data['email_retry_count'] < 0:
            return jsonify({
                'code': 1,
                'message': 'email_retry_count 必须是大于等于0的整数'
            }), 400

        if not isinstance(data['email_retry_delay'], int) or data['email_retry_delay'] < 1:
            return jsonify({
                'code': 1,
                'message': 'email_retry_delay 必须是大于0的整数'
            }), 400

        # 更新数据库配置
        with get_db_session() as session:
            config = session.query(EmailConfig).first()
            
            if not config:
                # 创建新配置
                config = EmailConfig()
                session.add(config)
            
            # 更新配置值
            config.enable_email_module = data['enable_email_module']
            config.enable_email_notification = data['enable_email_notification']
            config.recipient_emails = data['recipient_emails']
            config.sender_name = data['sender_name']
            config.sender_email = data['sender_email']
            config.sender_password = data['sender_password']
            config.email_provider = data['email_provider']
            config.custom_smtp_config = data.get('custom_smtp_config', {})
            config.max_articles_in_email = data['max_articles_in_email']
            config.email_template_language = data['email_template_language']
            config.email_format = data['email_format']
            config.email_send_timeout = data['email_send_timeout']
            config.email_retry_count = data['email_retry_count']
            config.email_retry_delay = data['email_retry_delay']
            config.updated_at = datetime.utcnow()
            
            session.commit()

        return jsonify({
            'code': 0,
            'message': '邮件配置更新成功'
        })

    except Exception as e:
        return jsonify({
            'code': 1,
            'message': f'更新邮件配置失败: {str(e)}'
        }), 500

