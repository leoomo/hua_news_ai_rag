#!/usr/bin/env python3
"""
RSS采集测试脚本
用于调试RSS内容获取问题
"""

import feedparser
import requests
from urllib.parse import urlparse
import re

def test_rss_source(url, name):
    """测试RSS源"""
    print(f"\n=== 测试RSS源: {name} ===")
    print(f"URL: {url}")
    
    try:
        # 获取RSS内容
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        print(f"HTTP状态码: {response.status_code}")
        print(f"内容长度: {len(response.content)} bytes")
        
        # 解析RSS
        parsed = feedparser.parse(response.content)
        print(f"解析结果: {len(parsed.entries)} 个条目")
        
        if parsed.bozo:
            print(f"RSS解析警告: {parsed.bozo_exception}")
        
        # 分析前几个条目
        for i, entry in enumerate(parsed.entries[:3]):
            print(f"\n条目 {i+1}:")
            print(f"  标题: {getattr(entry, 'title', 'N/A')}")
            print(f"  链接: {getattr(entry, 'link', 'N/A')}")
            print(f"  摘要: {getattr(entry, 'summary', 'N/A')[:100]}...")
            print(f"  描述: {getattr(entry, 'description', 'N/A')[:100]}...")
            
            # 检查是否有content字段
            if hasattr(entry, 'content'):
                print(f"  内容字段: {type(entry.content)}")
                if isinstance(entry.content, list) and len(entry.content) > 0:
                    print(f"  内容值: {entry.content[0].get('value', '')[:100]}...")
            
            # 检查发布时间
            if hasattr(entry, 'published_parsed'):
                print(f"  发布时间: {entry.published_parsed}")
                
    except Exception as e:
        print(f"错误: {e}")

def test_webpage_content(url):
    """测试网页内容获取"""
    print(f"\n=== 测试网页内容: {url} ===")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        print(f"HTTP状态码: {response.status_code}")
        print(f"内容长度: {len(response.content)} bytes")
        
        # 检查是否重定向到通用页面
        if '文章库' in response.text or 'article' in response.text.lower():
            print("⚠️  警告: 可能重定向到通用页面")
        
        # 尝试提取标题
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', response.text, re.IGNORECASE)
        if title_match:
            print(f"页面标题: {title_match.group(1)}")
        
        # 尝试提取正文内容
        content_patterns = [
            r'<article[^>]*>(.*?)</article>',
            r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>',
            r'<div[^>]*class="[^"]*article[^"]*"[^>]*>(.*?)</div>',
        ]
        
        for pattern in content_patterns:
            matches = re.findall(pattern, response.text, re.IGNORECASE | re.DOTALL)
            if matches:
                print(f"找到内容块: {len(matches)} 个")
                for j, match in enumerate(matches[:2]):
                    clean_text = re.sub(r'<[^>]+>', '', match).strip()
                    print(f"  内容{j+1}: {clean_text[:200]}...")
                break
        else:
            print("未找到标准内容块")
            
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    # 测试机器之心RSS源
    test_rss_source("http://www.jiqizhixin.com/rss", "机器之心")
    
    # 测试一个具体的文章页面
    test_webpage_content("https://www.jiqizhixin.com/articles/2025-09-01")
    
    print("\n=== 测试完成 ===")
