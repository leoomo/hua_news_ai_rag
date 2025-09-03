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

# 导入邮件配置
from .email_config import (
    EMAIL_PROVIDER, GMAIL_CONFIG, QQ_CONFIG, EMAIL_163_CONFIG,
    OUTLOOK_CONFIG, YAHOO_CONFIG, SINA_CONFIG, CUSTOM_CONFIG,
    ENABLE_EMAIL_NOTIFICATION, SENDER_NAME, RECIPIENT_EMAILS,
    MAX_ARTICLES_IN_EMAIL, EMAIL_TEMPLATE_LANGUAGE, EMAIL_FORMAT,
    EMAIL_SEND_TIMEOUT, EMAIL_RETRY_COUNT, EMAIL_RETRY_DELAY,
    ENABLE_EMAIL_MODULE
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailSender:
    """邮件发送器类"""
    
    def __init__(self):
        """初始化邮件发送器"""
        # 首先检查总开关
        if not ENABLE_EMAIL_MODULE:
            logger.info("邮件模块已禁用")
            self.enabled = False
            return
            
        self.config = self._get_provider_config()
        self.enabled = ENABLE_EMAIL_NOTIFICATION
        self.recipients = RECIPIENT_EMAILS
        self.sender_name = SENDER_NAME
        self.max_articles = MAX_ARTICLES_IN_EMAIL
        self.language = EMAIL_TEMPLATE_LANGUAGE
        self.timeout = EMAIL_SEND_TIMEOUT
        self.retry_count = EMAIL_RETRY_COUNT
        self.retry_delay = EMAIL_RETRY_DELAY
        
        if not self.enabled:
            logger.info("邮件通知功能已禁用")
            return
            
        if not self.recipients:
            logger.warning("未配置收件人邮箱，邮件通知功能将无法使用")
            return
            
        logger.info(f"邮件发送器初始化完成，使用 {EMAIL_PROVIDER} 服务商")
        logger.info(f"收件人: {', '.join(self.recipients)}")
    
    def _get_provider_config(self) -> Dict:
        """获取邮件服务商配置"""
        provider_mapping = {
            "gmail": GMAIL_CONFIG,
            "qq": QQ_CONFIG,
            "163": EMAIL_163_CONFIG,
            "outlook": OUTLOOK_CONFIG,
            "yahoo": YAHOO_CONFIG,
            "sina": SINA_CONFIG,
            "custom": CUSTOM_CONFIG
        }
        
        if EMAIL_PROVIDER not in provider_mapping:
            logger.warning(f"不支持的邮件服务商 '{EMAIL_PROVIDER}'，使用Gmail配置")
            return GMAIL_CONFIG
            
        return provider_mapping[EMAIL_PROVIDER]
    
    def _create_email_content(self, articles: List[Dict], language: str = "zh_cn") -> str:
        """创建邮件内容"""
        from .email_config import EMAIL_FORMAT
        
        if EMAIL_FORMAT == "markdown":
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
    
    def _send_single_email(self, recipient: str, subject: str, content: str) -> bool:
        """发送单个邮件"""
        for attempt in range(self.retry_count + 1):
            try:
                # 创建邮件
                msg = MIMEMultipart('alternative')
                msg['From'] = f"{self.sender_name} <{self.config['smtp_username']}>"
                msg['To'] = recipient
                msg['Subject'] = subject
                
                # 检查是否需要将Markdown转换为HTML
                from .email_config import EMAIL_FORMAT
                if EMAIL_FORMAT == "markdown":
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
                server.login(self.config['smtp_username'], self.config['smtp_password'])
                
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


# 全局邮件发送器实例
email_sender = EmailSender()


def send_rss_ingest_notification(articles: List[Dict]) -> bool:
    """发送RSS采集通知邮件（便捷函数）"""
    return email_sender.send_notification(articles)


def test_email_configuration() -> bool:
    """测试邮件配置（便捷函数）"""
    return email_sender.test_connection()
