from flask import Blueprint, request, jsonify
import os
import sys
import importlib.util
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# 导入邮件配置模块
email_config = None
try:
    from backend.email_fly import email_config
except ImportError:
    try:
        import email_config
    except ImportError:
        # 如果都导入失败，创建一个空的配置对象
        class DummyConfig:
            ENABLE_EMAIL_MODULE: bool = False
            ENABLE_EMAIL_NOTIFICATION: bool = False
            RECIPIENT_EMAILS: list[str] = []
            SENDER_NAME: str = "华新AI知识库系统"
            MAX_ARTICLES_IN_EMAIL: int = 10
            EMAIL_TEMPLATE_LANGUAGE: str = "zh_cn"
            EMAIL_FORMAT: str = "markdown"
            EMAIL_SEND_TIMEOUT: int = 30
            EMAIL_RETRY_COUNT: int = 3
            EMAIL_RETRY_DELAY: int = 5
        email_config = DummyConfig()

bp = Blueprint('settings', __name__)

@bp.route('/api/settings/email', methods=['GET'])
def get_email_config():
    """获取邮件配置"""
    try:
        config = {
            'enable_email_module': getattr(email_config, 'ENABLE_EMAIL_MODULE', False),
            'enable_email_notification': getattr(email_config, 'ENABLE_EMAIL_NOTIFICATION', True),
            'recipient_emails': getattr(email_config, 'RECIPIENT_EMAILS', []),
            'sender_name': getattr(email_config, 'SENDER_NAME', '华新AI知识库系统'),
            'max_articles_in_email': getattr(email_config, 'MAX_ARTICLES_IN_EMAIL', 10),
            'email_template_language': getattr(email_config, 'EMAIL_TEMPLATE_LANGUAGE', 'zh_cn'),
            'email_format': getattr(email_config, 'EMAIL_FORMAT', 'markdown'),
            'email_send_timeout': getattr(email_config, 'EMAIL_SEND_TIMEOUT', 30),
            'email_retry_count': getattr(email_config, 'EMAIL_RETRY_COUNT', 3),
            'email_retry_delay': getattr(email_config, 'EMAIL_RETRY_DELAY', 5),
        }
        
        return jsonify({
            'code': 0,
            'data': config,
            'message': '获取邮件配置成功'
        })
    except Exception as e:
        return jsonify({
            'code': 1,
            'message': f'获取邮件配置失败: {str(e)}'
        }), 500

@bp.route('/api/settings/email', methods=['POST'])
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
            'sender_name', 'max_articles_in_email', 'email_template_language',
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

        # 更新配置文件
        config_file_path = Path(__file__).parent.parent / 'email_fly' / 'email_config.py'
        
        if not config_file_path.exists():
            return jsonify({
                'code': 1,
                'message': '邮件配置文件不存在'
            }), 500

        # 读取当前配置文件内容
        with open(config_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 更新配置值
        content = _update_config_value(content, 'ENABLE_EMAIL_MODULE', str(data['enable_email_module']))
        content = _update_config_value(content, 'ENABLE_EMAIL_NOTIFICATION', str(data['enable_email_notification']))
        content = _update_config_value(content, 'RECIPIENT_EMAILS', _format_emails_list(data['recipient_emails']))
        content = _update_config_value(content, 'SENDER_NAME', f'"{data["sender_name"]}"')
        content = _update_config_value(content, 'MAX_ARTICLES_IN_EMAIL', str(data['max_articles_in_email']))
        content = _update_config_value(content, 'EMAIL_TEMPLATE_LANGUAGE', f'"{data["email_template_language"]}"')
        content = _update_config_value(content, 'EMAIL_FORMAT', f'"{data["email_format"]}"')
        content = _update_config_value(content, 'EMAIL_SEND_TIMEOUT', str(data['email_send_timeout']))
        content = _update_config_value(content, 'EMAIL_RETRY_COUNT', str(data['email_retry_count']))
        content = _update_config_value(content, 'EMAIL_RETRY_DELAY', str(data['email_retry_delay']))

        # 写入更新后的配置
        with open(config_file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # 重新加载配置模块
        try:
            if hasattr(email_config, '__file__'):
                importlib.reload(email_config)
        except:
            pass

        return jsonify({
            'code': 0,
            'message': '邮件配置更新成功'
        })

    except Exception as e:
        return jsonify({
            'code': 1,
            'message': f'更新邮件配置失败: {str(e)}'
        }), 500

def _update_config_value(content: str, key: str, value: str) -> str:
    """更新配置文件中的值"""
    import re
    
    # 查找并替换配置值
    pattern = rf'^{key}\s*=\s*.*$'
    replacement = f'{key} = {value}'
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if re.match(pattern, line.strip()):
            lines[i] = replacement
            break
    
    return '\n'.join(lines)

def _format_emails_list(emails: list) -> str:
    """格式化邮箱列表为Python代码格式"""
    if not emails:
        return '[]'
    
    formatted_emails = []
    for email in emails:
        formatted_emails.append(f'    "{email}",')
    
    return '[\n' + '\n'.join(formatted_emails) + '\n]'
