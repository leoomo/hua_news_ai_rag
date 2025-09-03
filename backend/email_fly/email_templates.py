#!/usr/bin/env python3
"""
邮件模板配置
支持中文和英文两种语言
支持HTML和Markdown两种格式
"""

# 中文邮件模板
ZH_CN_TEMPLATES = {
    'html': {
        'subject': '华新AI知识库 - 新文章通知',
        'template': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>新文章通知</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .article { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #fff; }
        .title { color: #007bff; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .summary { color: #666; margin-bottom: 10px; }
        .meta { color: #999; font-size: 12px; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>华新AI知识库 - 新文章通知</h1>
        <p>您好！系统检测到 {count} 篇新文章，请及时查看。</p>
    </div>
    
    {articles_html}
    
    <div class="footer">
        <p>此邮件由华新AI知识库系统自动发送</p>
        <p>发送时间：{send_time}</p>
    </div>
</body>
</html>
        ''',
        'article_template': '''
<div class="article">
    <div class="title">{title}</div>
    <div class="summary">{summary}</div>
    <div class="meta">
        来源：{source} | 发布时间：{published_at} | 分类：{category}
    </div>
</div>
        '''
    },
    'markdown': {
        'subject': '华新AI知识库 - 新文章通知',
        'template': '''
# 华新AI知识库 - 新文章通知

您好！系统检测到 {count} 篇新文章，请及时查看。

{articles_markdown}

---

**此邮件由华新AI知识库系统自动发送**  
**发送时间：{send_time}**
        ''',
        'article_template': '''
## {title}

{summary}

- **来源：** {source}
- **发布时间：** {published_at}
- **分类：** {category}

---
        '''
    }
}

# 英文邮件模板
EN_TEMPLATES = {
    'html': {
        'subject': 'Hua News AI Knowledge Base - New Articles Notification',
        'template': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Articles Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .article { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #fff; }
        .title { color: #007bff; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .summary { color: #666; margin-bottom: 10px; }
        .meta { color: #999; font-size: 12px; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Hua News AI Knowledge Base - New Articles Notification</h1>
        <p>Hello! The system detected {count} new articles. Please review them in time.</p>
    </div>
    
    {articles_html}
    
    <div class="footer">
        <p>This email is automatically sent by Hua News AI Knowledge Base System</p>
        <p>Sent time: {send_time}</p>
    </div>
</body>
</html>
        ''',
        'article_template': '''
<div class="article">
    <div class="title">{title}</div>
    <div class="summary">{summary}</div>
    <div class="meta">
        Source: {source} | Published: {published_at} | Category: {category}
    </div>
</div>
        '''
    },
    'markdown': {
        'subject': 'Hua News AI Knowledge Base - New Articles Notification',
        'template': '''
# Hua News AI Knowledge Base - New Articles Notification

Hello! The system detected {count} new articles. Please review them in time.

{articles_markdown}

---

**This email is automatically sent by Hua News AI Knowledge Base System**  
**Sent time: {send_time}**
        ''',
        'article_template': '''
## {title}

{summary}

- **Source:** {source}
- **Published:** {published_at}
- **Category:** {category}

---
        '''
    }
}

def get_email_template(language: str = 'zh_cn', format_type: str = 'markdown'):
    """获取邮件模板"""
    if language == 'zh_cn':
        return ZH_CN_TEMPLATES.get(format_type, ZH_CN_TEMPLATES['markdown'])
    else:
        return EN_TEMPLATES.get(format_type, EN_TEMPLATES['markdown'])

def format_articles_for_email(articles: list, template_type: str = 'markdown'):
    """格式化文章列表为邮件内容"""
    if template_type == 'html':
        article_template = get_email_template('zh_cn', 'html')['article_template']
        articles_html = ''
        for article in articles:
            articles_html += article_template.format(
                title=article.get('title', ''),
                summary=article.get('summary', ''),
                source=article.get('source', ''),
                published_at=article.get('published_at', ''),
                category=article.get('category', '')
            )
        return articles_html
    else:
        article_template = get_email_template('zh_cn', 'markdown')['article_template']
        articles_markdown = ''
        for article in articles:
            articles_markdown += article_template.format(
                title=article.get('title', ''),
                summary=article.get('summary', ''),
                source=article.get('source', ''),
                published_at=article.get('published_at', ''),
                category=article.get('category', '')
            )
        return articles_markdown
