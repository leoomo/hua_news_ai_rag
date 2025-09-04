#!/usr/bin/env python3
"""
基于数据库的邮件发送器模块
从数据库读取邮件配置并发送邮件
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

# 导入数据库相关模块
from backend.data.db import get_db_session
from backend.data.models import EmailConfig

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseEmailSender:
    """基于数据库的邮件发送器类"""
    
    def __init__(self):
        """初始化邮件发送器"""
        self.config = None
        self.enabled = False
        self.recipients = []
        self.sender_name = "华新AI知识库系统"
        self.max_articles = 10
        self.language = "zh_cn"
        self.timeout = 30
        self.retry_count = 3
        self.retry_delay = 5
        self.email_format = "markdown"
        
        # 从数据库加载配置
        self._load_config_from_db()
    
    def _load_config_from_db(self):
        """从数据库加载邮件配置"""
        try:
            with get_db_session() as session:
                config = session.query(EmailConfig).first()
                
                if not config:
                    logger.info("未找到邮件配置，邮件功能已禁用")
                    self.enabled = False
                    return
                
                # 检查邮件模块是否启用
                if not config.enable_email_module:
                    logger.info("邮件模块已禁用")
                    self.enabled = False
                    return
                
                # 加载配置
                self.enabled = config.enable_email_notification
                self.recipients = config.recipient_emails if config.recipient_emails else []
                self.sender_name = config.sender_name
                self.max_articles = config.max_articles_in_email
                self.language = config.email_template_language
                self.timeout = config.email_send_timeout
                self.retry_count = config.email_retry_count
                self.retry_delay = config.email_retry_delay
                self.email_format = config.email_format
                
                # 获取邮件服务商配置
                self.config = self._get_provider_config(config)
                
                logger.info(f"邮件配置加载成功，服务商: {config.email_provider}")
                
        except Exception as e:
            logger.error(f"加载邮件配置失败: {str(e)}")
            self.enabled = False
    
    def _get_provider_config(self, config: EmailConfig) -> Dict:
        """根据邮件服务商获取配置"""
        provider = config.email_provider
        
        if provider == 'custom':
            # 使用自定义SMTP配置
            custom_config = config.custom_smtp_config or {}
            return {
                'smtp_host': custom_config.get('smtp_host', 'smtp.your-server.com'),
                'smtp_port': custom_config.get('smtp_port', 587),
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': custom_config.get('smtp_use_tls', True),
                'smtp_use_ssl': custom_config.get('smtp_use_ssl', False)
            }
        elif provider == 'gmail':
            return {
                'smtp_host': 'smtp.gmail.com',
                'smtp_port': 587,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': True,
                'smtp_use_ssl': False
            }
        elif provider == 'qq':
            return {
                'smtp_host': 'smtp.qq.com',
                'smtp_port': 587,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': True,
                'smtp_use_ssl': False
            }
        elif provider == '163':
            return {
                'smtp_host': 'smtp.163.com',
                'smtp_port': 465,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': False,
                'smtp_use_ssl': True
            }
        elif provider == 'outlook':
            return {
                'smtp_host': 'smtp-mail.outlook.com',
                'smtp_port': 587,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': True,
                'smtp_use_ssl': False
            }
        elif provider == 'yahoo':
            return {
                'smtp_host': 'smtp.mail.yahoo.com',
                'smtp_port': 587,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': True,
                'smtp_use_ssl': False
            }
        elif provider == 'sina':
            return {
                'smtp_host': 'smtp.sina.com',
                'smtp_port': 25,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': False,
                'smtp_use_ssl': False
            }
        else:
            # 默认使用163配置
            return {
                'smtp_host': 'smtp.163.com',
                'smtp_port': 465,
                'smtp_username': config.sender_email,
                'smtp_password': config.sender_password,
                'smtp_use_tls': False,
                'smtp_use_ssl': True
            }
    
    def send_email(self, subject: str, content: str, recipients: Optional[List[str]] = None) -> bool:
        """
        发送邮件
        
        Args:
            subject: 邮件主题
            content: 邮件内容
            recipients: 收件人列表，如果为None则使用配置中的收件人
            
        Returns:
            bool: 发送是否成功
        """
        if not self.enabled:
            logger.info("邮件功能已禁用，跳过发送")
            return False
        
        if not self.config:
            logger.error("邮件配置未加载")
            return False
        
        # 使用指定的收件人或配置中的收件人
        target_recipients = recipients or self.recipients
        if not target_recipients:
            logger.warning("没有收件人，跳过发送")
            return False
        
        # 重新加载配置以确保使用最新设置
        self._load_config_from_db()
        
        # 处理邮件内容格式
        if self.email_format == 'markdown':
            html_content = self._markdown_to_html(content)
        else:
            html_content = content
        
        # 创建邮件
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{self.sender_name} <{self.config['smtp_username']}>"
        msg['To'] = ', '.join(target_recipients)
        
        # 添加HTML内容
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # 发送邮件
        return self._send_with_retry(msg, target_recipients)
    
    def _send_with_retry(self, msg: MIMEMultipart, recipients: List[str]) -> bool:
        """带重试机制的邮件发送"""
        for attempt in range(self.retry_count + 1):
            try:
                if self.config['smtp_use_ssl']:
                    # 使用SSL连接
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(
                        self.config['smtp_host'], 
                        self.config['smtp_port'], 
                        timeout=self.timeout,
                        context=context
                    ) as server:
                        server.login(self.config['smtp_username'], self.config['smtp_password'])
                        server.send_message(msg, to_addrs=recipients)
                else:
                    # 使用TLS连接
                    with smtplib.SMTP(
                        self.config['smtp_host'], 
                        self.config['smtp_port'], 
                        timeout=self.timeout
                    ) as server:
                        if self.config['smtp_use_tls']:
                            server.starttls()
                        server.login(self.config['smtp_username'], self.config['smtp_password'])
                        server.send_message(msg, to_addrs=recipients)
                
                logger.info(f"邮件发送成功，收件人: {', '.join(recipients)}")
                return True
                
            except Exception as e:
                logger.error(f"邮件发送失败 (尝试 {attempt + 1}/{self.retry_count + 1}): {str(e)}")
                if attempt < self.retry_count:
                    logger.info(f"等待 {self.retry_delay} 秒后重试...")
                    time.sleep(self.retry_delay)
                else:
                    logger.error("邮件发送最终失败")
                    return False
        
        return False
    
    def _markdown_to_html(self, markdown_content: str) -> str:
        """将Markdown内容转换为HTML"""
        try:
            html = markdown.markdown(
                markdown_content,
                extensions=['tables', 'fenced_code', 'codehilite']
            )
            
            # 添加基本的CSS样式
            styled_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    h1, h2, h3, h4, h5, h6 {{
                        color: #2c3e50;
                        margin-top: 30px;
                        margin-bottom: 15px;
                    }}
                    h1 {{ border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
                    h2 {{ border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }}
                    p {{ margin-bottom: 15px; }}
                    ul, ol {{ margin-bottom: 15px; padding-left: 30px; }}
                    li {{ margin-bottom: 5px; }}
                    blockquote {{
                        border-left: 4px solid #3498db;
                        margin: 20px 0;
                        padding: 10px 20px;
                        background-color: #f8f9fa;
                    }}
                    code {{
                        background-color: #f1f2f6;
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: 'Monaco', 'Menlo', monospace;
                    }}
                    pre {{
                        background-color: #2c3e50;
                        color: #ecf0f1;
                        padding: 15px;
                        border-radius: 5px;
                        overflow-x: auto;
                    }}
                    pre code {{
                        background-color: transparent;
                        padding: 0;
                    }}
                    table {{
                        border-collapse: collapse;
                        width: 100%;
                        margin: 20px 0;
                    }}
                    th, td {{
                        border: 1px solid #bdc3c7;
                        padding: 8px 12px;
                        text-align: left;
                    }}
                    th {{
                        background-color: #3498db;
                        color: white;
                    }}
                    a {{
                        color: #3498db;
                        text-decoration: none;
                    }}
                    a:hover {{
                        text-decoration: underline;
                    }}
                </style>
            </head>
            <body>
                {html}
            </body>
            </html>
            """
            return styled_html
            
        except Exception as e:
            logger.error(f"Markdown转换失败: {str(e)}")
            # 如果转换失败，返回原始内容
            return f"<pre>{markdown_content}</pre>"
    
    def send_ingest_notification(self, articles: List[Dict], source_name: str = "RSS源") -> bool:
        """
        发送采集通知邮件
        
        Args:
            articles: 文章列表
            source_name: 数据源名称
            
        Returns:
            bool: 发送是否成功
        """
        if not articles:
            logger.info("没有新文章，跳过邮件通知")
            return True
        
        # 限制文章数量
        limited_articles = articles[:self.max_articles]
        
        # 生成邮件内容
        subject = f"📰 {source_name} 采集完成 - {len(limited_articles)} 篇新文章"
        content = self._generate_ingest_content(limited_articles, source_name)
        
        return self.send_email(subject, content)
    
    def _generate_ingest_content(self, articles: List[Dict], source_name: str) -> str:
        """生成采集通知邮件内容"""
        if self.language == 'zh_cn':
            content = f"# 📰 {source_name} 采集完成\n\n"
            content += f"本次采集到 **{len(articles)}** 篇新文章：\n\n"
            
            for i, article in enumerate(articles, 1):
                content += f"## {i}. {article.get('title', '无标题')}\n\n"
                content += f"**来源：** {article.get('source_name', '未知')}\n\n"
                content += f"**发布时间：** {article.get('published_at', '未知')}\n\n"
                
                # 添加摘要
                summary = article.get('summary', '')
                if summary:
                    content += f"**摘要：** {summary}\n\n"
                
                # 添加链接
                url = article.get('url', '')
                if url:
                    content += f"**原文链接：** [点击查看]({url})\n\n"
                
                content += "---\n\n"
            
            content += f"\n\n*此邮件由华新AI知识库系统自动发送*"
            
        else:  # English
            content = f"# 📰 {source_name} Ingestion Complete\n\n"
            content += f"Found **{len(articles)}** new articles:\n\n"
            
            for i, article in enumerate(articles, 1):
                content += f"## {i}. {article.get('title', 'No Title')}\n\n"
                content += f"**Source:** {article.get('source_name', 'Unknown')}\n\n"
                content += f"**Published:** {article.get('published_at', 'Unknown')}\n\n"
                
                # Add summary
                summary = article.get('summary', '')
                if summary:
                    content += f"**Summary:** {summary}\n\n"
                
                # Add link
                url = article.get('url', '')
                if url:
                    content += f"**Original Link:** [View Article]({url})\n\n"
                
                content += "---\n\n"
            
            content += f"\n\n*This email was automatically sent by Hua News AI Knowledge Base System*"
        
        return content


# 创建全局实例
db_email_sender = DatabaseEmailSender()
