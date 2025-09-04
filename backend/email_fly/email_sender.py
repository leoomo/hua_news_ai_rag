#!/usr/bin/env python3
"""
邮件发送器模块
实现采集后的自动邮件通知功能
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional, Union
import logging
from datetime import datetime
import time
import markdown

# 导入数据库邮件配置
from data.db import get_db_session
from data.models import EmailConfig

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailSender:
    """邮件发送器类"""
    
    def __init__(self):
        """初始化邮件发送器"""
        self.config_data = self._load_config_from_db()
        
        if not self.config_data:
            logger.info("邮件模块已禁用或配置未找到")
            self.enabled = False
            return
            
        if not self.config_data.get('enable_email_module', False):
            logger.info("邮件模块已禁用")
            self.enabled = False
            return
            
        self.config = self._get_provider_config()
        self.enabled = self.config_data.get('enable_email_notification', True)
        self.recipients = self.config_data.get('recipient_emails', [])
        self.sender_name = self.config_data.get('sender_name', '华新AI知识库系统')
        self.max_articles = self.config_data.get('max_articles_in_email', 10)
        self.language = self.config_data.get('email_template_language', 'zh_cn')
        self.timeout = self.config_data.get('email_send_timeout', 30)
        self.retry_count = self.config_data.get('email_retry_count', 3)
        self.retry_delay = self.config_data.get('email_retry_delay', 5)
        
        if not self.enabled:
            logger.info("邮件通知功能已禁用")
            return
            
        if not self.recipients:
            logger.warning("未配置收件人邮箱，邮件通知功能将无法使用")
            return
            
        email_provider = self.config_data.get('email_provider', '163')
        logger.info(f"邮件发送器初始化完成，使用 {email_provider} 服务商")
        logger.info(f"收件人: {', '.join(self.recipients)}")
    
    def _load_config_from_db(self) -> Optional[Dict]:
        """从数据库加载邮件配置"""
        try:
            with get_db_session() as session:
                config = session.query(EmailConfig).first()
                if not config:
                    return None
                
                return {
                    'enable_email_module': config.enable_email_module,
                    'enable_email_notification': config.enable_email_notification,
                    'recipient_emails': config.recipient_emails if config.recipient_emails else [],
                    'sender_name': config.sender_name,
                    'sender_email': config.sender_email,
                    'sender_password': config.sender_password,
                    'email_provider': config.email_provider,
                    'custom_smtp_config': config.custom_smtp_config if config.custom_smtp_config else {},
                    'max_articles_in_email': config.max_articles_in_email,
                    'email_template_language': config.email_template_language,
                    'email_format': config.email_format,
                    'email_send_timeout': config.email_send_timeout,
                    'email_retry_count': config.email_retry_count,
                    'email_retry_delay': config.email_retry_delay,
                }
        except Exception as e:
            logger.error(f"从数据库加载邮件配置失败: {e}")
            return None
    
    def _get_provider_config(self) -> Dict:
        """获取邮件服务商配置"""
        email_provider = self.config_data.get('email_provider', '163')
        
        # 预定义的邮件服务商配置
        provider_configs = {
            "gmail": {
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "smtp_use_tls": True,
                "smtp_use_ssl": False
            },
            "qq": {
                "smtp_host": "smtp.qq.com",
                "smtp_port": 587,
                "smtp_use_tls": True,
                "smtp_use_ssl": False
            },
            "163": {
                "smtp_host": "smtp.163.com",
                "smtp_port": 587,
                "smtp_use_tls": True,
                "smtp_use_ssl": False
            },
            "outlook": {
                "smtp_host": "smtp-mail.outlook.com",
                "smtp_port": 587,
                "smtp_use_tls": True,
                "smtp_use_ssl": False
            },
            "yahoo": {
                "smtp_host": "smtp.mail.yahoo.com",
                "smtp_port": 587,
                "smtp_use_tls": True,
                "smtp_use_ssl": False
            },
            "sina": {
                "smtp_host": "smtp.sina.com",
                "smtp_port": 587,
                "smtp_use_tls": True,
                "smtp_use_ssl": False
            }
        }
        
        if email_provider == "custom":
            # 使用自定义SMTP配置
            custom_config = self.config_data.get('custom_smtp_config', {})
            return {
                "smtp_host": custom_config.get('smtp_host', 'smtp.your-server.com'),
                "smtp_port": custom_config.get('smtp_port', 587),
                "smtp_use_tls": custom_config.get('smtp_use_tls', True),
                "smtp_use_ssl": custom_config.get('smtp_use_ssl', False)
            }
        elif email_provider in provider_configs:
            return provider_configs[email_provider]
        else:
            logger.warning(f"不支持的邮件服务商 '{email_provider}'，使用163配置")
            return provider_configs["163"]
    
    def _create_email_content(self, articles: List[Dict], language: str = "zh_cn") -> str:
        """创建邮件内容"""
        email_format = self.config_data.get('email_format', 'markdown')
        
        if email_format == "markdown":
            if language == "zh_cn":
                return self._create_chinese_markdown_content(articles)
            else:
                return self._create_english_markdown_content(articles)
        else:
            if language == "zh_cn":
                return self._create_chinese_content(articles)
            else:
                return self._create_english_content(articles)
    
    def _create_chinese_content(self, articles: List[Dict]) -> str:
        """创建中文邮件内容"""
        if not articles:
            return "暂无新文章"
        
        # 限制文章数量
        articles = articles[:self.max_articles]
        
        content = f"""
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; }}
                .article {{ margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa; }}
                .title {{ font-size: 16px; font-weight: bold; color: #007bff; margin-bottom: 8px; }}
                .summary {{ color: #666; margin-bottom: 8px; }}
                .meta {{ color: #999; font-size: 12px; }}
                .footer {{ margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📰 华新AI知识库 - 新文章通知</h2>
                <p>采集时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p>本次共采集到 {len(articles)} 篇新文章</p>
            </div>
        """
        
        for i, article in enumerate(articles, 1):
            title = article.get('title', '无标题')
            summary = article.get('summary', '无摘要')
            source = article.get('source', '未知来源')
            url = article.get('url', '')
            category = article.get('category', '未分类')
            created_at = article.get('created_at', '')
            
            content += f"""
            <div class="article">
                <div class="title">{i}. {title}</div>
                <div class="summary">{summary}</div>
                <div class="meta">
                    <strong>来源:</strong> {source} | 
                    <strong>分类:</strong> {category} | 
                    <strong>时间:</strong> {created_at}
                </div>
                {f'<div class="meta"><strong>链接:</strong> <a href="{url}">{url}</a></div>' if url else ''}
            </div>
            """
        
        content += f"""
            <div class="footer">
                <p>此邮件由华新AI知识库系统自动发送</p>
                <p>如需停止接收通知，请联系系统管理员</p>
            </div>
        </body>
        </html>
        """
        
        return content
    
    def _create_chinese_markdown_content(self, articles: List[Dict]) -> str:
        """创建中文Markdown邮件内容"""
        if not articles:
            return "暂无新文章"
        
        # 限制文章数量
        articles = articles[:self.max_articles]
        
        content = f"""# 📰 华新AI知识库 - 新文章通知

**采集时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**本次共采集到**: {len(articles)} 篇新文章

---
"""
        
        for i, article in enumerate(articles, 1):
            title = article.get('title', '无标题')
            summary = article.get('summary', '无摘要')
            source = article.get('source', '未知来源')
            url = article.get('url', '')
            category = article.get('category', '未分类')
            created_at = article.get('created_at', '')
            
            content += f"""## {i}. {title}

**摘要**: {summary}

**来源**: {source} | **分类**: {category} | **时间**: {created_at}

"""
            if url:
                content += f"**链接**: [{url}]({url})"
            
            content += "\n\n---\n\n"
        
        content += """## 📧 邮件信息

此邮件由华新AI知识库系统自动发送  
如需停止接收通知，请联系系统管理员

---
*华新AI知识库系统 - 智能信息采集与知识管理*
"""
        
        return content
    
    def _create_english_markdown_content(self, articles: List[Dict]) -> str:
        """创建英文Markdown邮件内容"""
        if not articles:
            return "No new articles"
        
        # 限制文章数量
        articles = articles[:self.max_articles]
        
        content = f"""# 📰 Hua News AI Knowledge Base - New Articles Notification

**Collection Time**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Total Articles**: {len(articles)} new articles collected

---
"""
        
        for i, article in enumerate(articles, 1):
            title = article.get('title', 'No Title')
            summary = article.get('summary', 'No Summary')
            source = article.get('source', 'Unknown Source')
            url = article.get('url', '')
            category = article.get('category', 'Uncategorized')
            created_at = article.get('created_at', '')
            
            content += f"""## {i}. {title}

**Summary**: {summary}

**Source**: {source} | **Category**: {category} | **Time**: {created_at}

"""
            if url:
                content += f"**Link**: [{url}]({url})"
            
            content += "\n\n---\n\n"
        
        content += """## 📧 Email Information

This email is automatically sent by Hua News AI Knowledge Base System  
To stop receiving notifications, please contact system administrator

---
*Hua News AI Knowledge Base System - Intelligent Information Collection & Knowledge Management*
"""
        
        return content
    
    def _create_english_content(self, articles: List[Dict]) -> str:
        """创建英文邮件内容"""
        if not articles:
            return "No new articles"
        
        # 限制文章数量
        articles = articles[:self.max_articles]
        
        content = f"""
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; }}
                .article {{ margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa; }}
                .title {{ font-size: 16px; font-weight: bold; color: #007bff; margin-bottom: 8px; }}
                .summary {{ color: #666; margin-bottom: 8px; }}
                .meta {{ color: #999; font-size: 12px; }}
                .footer {{ margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📰 Hua News AI Knowledge Base - New Articles Notification</h2>
                <p>Collection Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p>Total {len(articles)} new articles collected</p>
            </div>
        """
        
        for i, article in enumerate(articles, 1):
            title = article.get('title', 'No Title')
            summary = article.get('summary', 'No Summary')
            source = article.get('source', 'Unknown Source')
            url = article.get('url', '')
            category = article.get('category', 'Uncategorized')
            created_at = article.get('created_at', '')
            
            content += f"""
            <div class="article">
                <div class="title">{i}. {title}</div>
                <div class="summary">{summary}</div>
                <div class="meta">
                    <strong>Source:</strong> {source} | 
                    <strong>Category:</strong> {category} | 
                    <strong>Time:</strong> {created_at}
                </div>
                {f'<div class="meta"><strong>Link:</strong> <a href="{url}">{url}</a></div>' if url else ''}
            </div>
            """
        
        content += f"""
            <div class="footer">
                <p>This email is automatically sent by Hua News AI Knowledge Base System</p>
                <p>To stop receiving notifications, please contact system administrator</p>
            </div>
        </body>
        </html>
        """
        
        return content
    
    def send_notification(self, articles: List[Dict]) -> bool:
        """发送采集通知邮件"""
        if not self.enabled:
            logger.info("邮件通知功能已禁用")
            return False
            
        if not self.recipients:
            logger.warning("未配置收件人邮箱")
            return False
            
        if not articles:
            logger.info("没有新文章，跳过邮件发送")
            return False
        
        # 创建邮件内容
        subject = f"华新AI知识库 - 新文章通知 ({len(articles)}篇)" if self.language == "zh_cn" else f"Hua News AI KB - New Articles ({len(articles)} articles)"
        content = self._create_email_content(articles, self.language)
        
        # 发送邮件给所有收件人
        success_count = 0
        for recipient in self.recipients:
            if self._send_single_email(recipient, subject, content):
                success_count += 1
        
        logger.info(f"邮件发送完成: {success_count}/{len(self.recipients)} 成功")
        return success_count > 0

    def send_notification_with_details(self, articles: List[Dict]) -> Dict:
        """发送采集通知邮件并返回详细结果"""
        from datetime import datetime
        result = {
            "success": False,
            "success_count": 0,
            "total_count": 0,
            "errors": [],
            "message": "",
            "send_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "failure_reason": ""
        }
        
        if not self.enabled:
            result["message"] = "邮件通知功能已禁用"
            result["failure_reason"] = "邮件模块未启用"
            logger.info("邮件通知功能已禁用")
            return result
            
        if not self.recipients:
            result["message"] = "未配置收件人邮箱"
            result["failure_reason"] = "未配置收件人邮箱地址"
            logger.warning("未配置收件人邮箱")
            return result
            
        if not articles:
            result["message"] = "没有新文章，跳过邮件发送"
            result["failure_reason"] = "没有新文章需要发送"
            logger.info("没有新文章，跳过邮件发送")
            return result
        
        # 创建邮件内容
        subject = f"华新AI知识库 - 新文章通知 ({len(articles)}篇)" if self.language == "zh_cn" else f"Hua News AI KB - New Articles ({len(articles)} articles)"
        content = self._create_email_content(articles, self.language)
        
        # 发送邮件给所有收件人
        result["total_count"] = len(self.recipients)
        success_count = 0
        errors = []
        
        for recipient in self.recipients:
            success, error_msg = self._send_single_email_with_details(recipient, subject, content)
            if success:
                success_count += 1
            else:
                errors.append(f"{recipient}: {error_msg}")
        
        result["success_count"] = success_count
        result["errors"] = errors
        result["success"] = success_count > 0
        
        if success_count == result["total_count"]:
            result["message"] = f"邮件发送成功，已通知 {success_count} 位收件人"
            result["failure_reason"] = ""
        elif success_count > 0:
            result["message"] = f"邮件部分发送成功，{success_count}/{result['total_count']} 位收件人收到通知"
            result["failure_reason"] = f"部分收件人发送失败，共 {len(errors)} 个错误"
        else:
            result["message"] = f"邮件发送失败，{result['total_count']} 位收件人均未收到通知"
            # 分析主要失败原因
            if errors:
                # 统计最常见的错误类型
                error_types: dict[str, int] = {}
                for error in errors:
                    error_msg = error.split(': ', 1)[1] if ': ' in error else error
                    error_types[error_msg] = error_types.get(error_msg, 0) + 1
                
                # 获取最常见的错误
                most_common_error = max(error_types.items(), key=lambda x: x[1])
                result["failure_reason"] = f"主要错误: {most_common_error[0]} (影响 {most_common_error[1]} 个收件人)"
            else:
                result["failure_reason"] = "未知错误"
        
        logger.info(f"邮件发送完成: {success_count}/{result['total_count']} 成功")
        return result
    
    def _send_single_email(self, recipient: str, subject: str, content: str) -> bool:
        """发送单个邮件"""
        for attempt in range(self.retry_count + 1):
            try:
                # 创建邮件
                msg = MIMEMultipart('alternative')
                sender_email = self.config_data.get('sender_email', '')
                msg['From'] = f"{self.sender_name} <{sender_email}>"
                msg['To'] = recipient
                msg['Subject'] = subject
                
                # 检查是否需要将Markdown转换为HTML
                email_format = self.config_data.get('email_format', 'markdown')
                if email_format == "markdown":
                    # 将Markdown转换为HTML
                    html_content = markdown.markdown(
                        content, 
                        extensions=['extra', 'codehilite', 'tables'],
                        output_format='html5'
                    )
                    # 添加CSS样式
                    html_content = f"""
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                            h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
                            h2 {{ color: #34495e; border-left: 4px solid #3498db; padding-left: 15px; }}
                            strong {{ color: #2c3e50; }}
                            a {{ color: #3498db; text-decoration: none; }}
                            a:hover {{ text-decoration: underline; }}
                            hr {{ border: none; border-top: 1px solid #ecf0f1; margin: 20px 0; }}
                            .meta {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }}
                            .footer {{ margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 5px; color: #7f8c8d; }}
                        </style>
                    </head>
                    <body>
                        {html_content}
                    </body>
                    </html>
                    """
                    content_type = 'html'
                    content_to_send = html_content
                else:
                    content_type = 'html'
                    content_to_send = content
                
                # 添加内容
                html_part = MIMEText(content_to_send, content_type, 'utf-8')
                msg.attach(html_part)
                
                # 连接SMTP服务器
                server: Union[smtplib.SMTP, smtplib.SMTP_SSL]
                if self.config['smtp_use_ssl']:
                    server = smtplib.SMTP_SSL(
                        self.config['smtp_host'], 
                        self.config['smtp_port'], 
                        timeout=self.timeout
                    )
                else:
                    server = smtplib.SMTP(
                        self.config['smtp_host'], 
                        self.config['smtp_port'], 
                        timeout=self.timeout
                    )
                
                # 启用TLS
                if self.config['smtp_use_tls']:
                    server.starttls(context=ssl.create_default_context())
                
                # 登录
                sender_email = self.config_data.get('sender_email', '')
                sender_password = self.config_data.get('sender_password', '')
                server.login(sender_email, sender_password)
                
                # 发送邮件
                server.send_message(msg)
                server.quit()
                
                logger.info(f"邮件发送成功: {recipient}")
                return True
                
            except Exception as e:
                logger.error(f"邮件发送失败 (尝试 {attempt + 1}/{self.retry_count + 1}): {recipient} - {str(e)}")
                
                if attempt < self.retry_count:
                    time.sleep(self.retry_delay)
                else:
                    logger.error(f"邮件发送最终失败: {recipient}")
                    return False
        
        return False

    def _send_single_email_with_details(self, recipient: str, subject: str, content: str) -> tuple[bool, str]:
        """发送单个邮件并返回详细结果"""
        last_error = ""
        for attempt in range(self.retry_count + 1):
            try:
                # 创建邮件
                msg = MIMEMultipart('alternative')
                sender_email = self.config_data.get('sender_email', '')
                msg['From'] = f"{self.sender_name} <{sender_email}>"
                msg['To'] = recipient
                msg['Subject'] = subject
                
                # 检查是否需要将Markdown转换为HTML
                email_format = self.config_data.get('email_format', 'markdown')
                if email_format == "markdown":
                    # 将Markdown转换为HTML
                    html_content = markdown.markdown(
                        content, 
                        extensions=['extra', 'codehilite', 'tables'],
                        output_format='html5'
                    )
                    # 添加CSS样式
                    html_content = f"""
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                            h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
                            h2 {{ color: #34495e; border-left: 4px solid #3498db; padding-left: 15px; }}
                            strong {{ color: #2c3e50; }}
                            a {{ color: #3498db; text-decoration: none; }}
                            a:hover {{ text-decoration: underline; }}
                            hr {{ border: none; border-top: 1px solid #ecf0f1; margin: 20px 0; }}
                            .meta {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }}
                            .footer {{ margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 5px; color: #7f8c8d; }}
                        </style>
                    </head>
                    <body>
                    {html_content}
                    </body>
                    </html>
                    """
                    msg.attach(MIMEText(html_content, 'html', 'utf-8'))
                else:
                    msg.attach(MIMEText(content, 'plain', 'utf-8'))
                
                # 获取SMTP配置
                smtp_config = self._get_provider_config()
                
                # 连接SMTP服务器并发送
                with smtplib.SMTP(smtp_config['host'], smtp_config['port']) as server:
                    if smtp_config.get('tls', False):
                        server.starttls()
                    elif smtp_config.get('ssl', False):
                        server = smtplib.SMTP_SSL(smtp_config['host'], smtp_config['port'])
                    
                    server.login(smtp_config['username'], smtp_config['password'])
                    server.send_message(msg)
                
                logger.info(f"邮件发送成功: {recipient}")
                return True, ""
                
            except Exception as e:
                error_msg = str(e)
                last_error = error_msg
                logger.error(f"邮件发送失败 (尝试 {attempt + 1}/{self.retry_count + 1}): {recipient} - {error_msg}")
                
                if attempt < self.retry_count:
                    time.sleep(self.retry_delay)
                else:
                    logger.error(f"邮件发送最终失败: {recipient}")
                    return False, error_msg
        
        return False, last_error
    
    def test_connection(self) -> bool:
        """测试邮件服务器连接"""
        try:
            server: Union[smtplib.SMTP, smtplib.SMTP_SSL]
            if self.config['smtp_use_ssl']:
                server = smtplib.SMTP_SSL(
                    self.config['smtp_host'], 
                    self.config['smtp_port'], 
                    timeout=self.timeout
                )
            else:
                server = smtplib.SMTP(
                    self.config['smtp_host'], 
                    self.config['smtp_port'], 
                    timeout=self.timeout
                )
            
            if self.config['smtp_use_tls']:
                server.starttls(context=ssl.create_default_context())
            
            server.login(self.config['smtp_username'], self.config['smtp_password'])
            server.quit()
            
            logger.info("邮件服务器连接测试成功")
            return True
            
        except Exception as e:
            logger.error(f"邮件服务器连接测试失败: {str(e)}")
            return False


# 全局邮件发送器实例（延迟初始化）
_email_sender = None

def get_email_sender() -> EmailSender:
    """获取邮件发送器实例（延迟初始化）"""
    global _email_sender
    if _email_sender is None:
        _email_sender = EmailSender()
    return _email_sender


def send_rss_ingest_notification(articles: List[Dict]) -> bool:
    """发送RSS采集通知邮件（便捷函数）"""
    email_sender = get_email_sender()
    return email_sender.send_notification(articles)


def test_email_configuration() -> bool:
    """测试邮件配置（便捷函数）"""
    email_sender = get_email_sender()
    return email_sender.test_connection()

def send_rss_ingest_notification_with_details(articles: List[Dict]) -> Dict:
    """发送RSS采集通知邮件并返回详细结果（便捷函数）"""
    email_sender = get_email_sender()
    return email_sender.send_notification_with_details(articles)
