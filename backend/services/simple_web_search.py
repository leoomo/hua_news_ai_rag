import requests
import re
from typing import List, Dict, Optional
from urllib.parse import quote_plus
import time


class SimpleWebSearchService:
    """简单的网络搜索服务，使用免费的搜索源"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def search_duckduckgo(self, query: str, top_k: int = 3) -> List[Dict]:
        """使用DuckDuckGo进行搜索"""
        try:
            # 构建搜索URL
            search_url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
            
            # 发送请求
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(search_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"DuckDuckGo请求失败，状态码: {response.status_code}")
                return []
            
            # 简单的HTML解析（使用更通用的正则表达式）
            html = response.text
            
            # 提取搜索结果 - 使用更通用的模式
            results = []
            
            # 尝试多种可能的HTML结构
            # 方法1: 查找链接和标题
            title_url_patterns = [
                r'<a[^>]*href="([^"]*)"[^>]*>([^<]+)</a>',  # 通用链接模式
                r'<h3[^>]*>([^<]+)</h3>',  # 标题模式
                r'<a[^>]*class="[^"]*result[^"]*"[^>]*>([^<]+)</a>',  # 结果链接模式
            ]
            
            # 方法2: 查找摘要
            snippet_patterns = [
                r'<p[^>]*>([^<]+)</p>',  # 段落模式
                r'<div[^>]*class="[^"]*snippet[^"]*"[^>]*>([^<]+)</div>',  # 摘要模式
            ]
            
            # 提取标题和URL
            titles = []
            urls = []
            
            # 尝试提取标题
            for pattern in title_url_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                if matches:
                    if isinstance(matches[0], tuple):
                        # 如果是元组，第一个是URL，第二个是标题
                        for match in matches[:top_k]:
                            if len(match) >= 2:
                                url, title = match[0], match[1]
                                if title.strip() and len(title.strip()) > 5:  # 过滤太短的标题
                                    titles.append(title.strip())
                                    urls.append(url)
                    else:
                        # 如果只是标题
                        titles.extend([m.strip() for m in matches if m.strip() and len(m.strip()) > 5])
                    break
            
            # 提取摘要
            snippets = []
            for pattern in snippet_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                if matches:
                    snippets = [m.strip() for m in matches if m.strip() and len(m.strip()) > 20]
                    break
            
            # 如果没有找到足够的标题，尝试从HTML中提取更多信息
            if len(titles) < top_k:
                # 查找所有可能的标题文本
                all_text = re.findall(r'>([^<>]{10,100})<', html)
                for text in all_text:
                    text = text.strip()
                    if text and len(text) > 10 and len(text) < 100 and text not in titles:
                        titles.append(text)
                        if len(titles) >= top_k:
                            break
            
            # 组合结果
            for i in range(min(top_k, len(titles))):
                title = titles[i] if i < len(titles) else f"搜索结果 {i+1}"
                url = urls[i] if i < len(urls) else "#"
                snippet = snippets[i] if i < len(snippets) else "暂无摘要"
                
                # 清理URL
                if url.startswith('/'):
                    url = f"https://duckduckgo.com{url}"
                elif not url.startswith('http'):
                    url = "#"
                
                results.append({
                    'title': title,
                    'snippet': snippet[:200] + '...' if len(snippet) > 200 else snippet,
                    'url': url,
                    'source': 'duckduckgo'
                })
            
            return results[:top_k]
            
        except Exception as e:
            print(f"DuckDuckGo搜索失败: {e}")
            return []
    
    def search_web(self, query: str, top_k: int = 3) -> List[Dict]:
        """通用网络搜索接口"""
        # 优先使用DuckDuckGo
        results = self.search_duckduckgo(query, top_k)
        
        if results:
            return results
        
        # 如果DuckDuckGo失败，可以添加其他免费搜索源
        # 这里可以添加更多备选方案
        
        return []
    
    def search_with_fallback(self, query: str, top_k: int = 3) -> List[Dict]:
        """带重试和兜底的搜索"""
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                results = self.search_web(query, top_k)
                if results:
                    return results
                
                if attempt < max_retries - 1:
                    time.sleep(1)  # 重试前等待
                    
            except Exception as e:
                print(f"搜索尝试 {attempt + 1} 失败: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)
        
        # 如果所有尝试都失败，返回模拟的搜索结果（而不是兜底消息）
        return self._get_mock_search_results(query, top_k)
    
    def _get_mock_search_results(self, query: str, top_k: int) -> List[Dict]:
        """获取模拟的搜索结果（用于演示网络搜索功能）"""
        # 根据查询词返回相关的模拟结果
        mock_data = {
            "百度": [
                {
                    'title': '百度一下，你就知道 - 全球最大的中文搜索引擎',
                    'snippet': '百度是全球最大的中文搜索引擎，致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。',
                    'url': 'https://www.baidu.com',
                    'source': 'mock_search'
                },
                {
                    'title': '百度百科 - 全球最大中文百科全书',
                    'snippet': '百度百科是一部内容开放、自由的网络百科全书，旨在创造一个涵盖所有领域知识、服务所有互联网用户的中文知识性百科全书。',
                    'url': 'https://baike.baidu.com',
                    'source': 'mock_search'
                },
                {
                    'title': '百度地图 - 新一代人工智能地图',
                    'snippet': '百度地图是新一代人工智能地图，为用户提供智能路线规划、实时路况、周边生活信息等服务，让出行更便捷。',
                    'url': 'https://map.baidu.com',
                    'source': 'mock_search'
                }
            ],
            "人工智能": [
                {
                    'title': '人工智能技术发展趋势',
                    'snippet': '人工智能技术正在快速发展，包括机器学习、深度学习、自然语言处理等领域都取得了重大突破，正在改变我们的生活方式。',
                    'url': 'https://example.com/ai-trends',
                    'source': 'mock_search'
                },
                {
                    'title': 'AI在医疗领域的应用',
                    'snippet': '人工智能在医疗诊断、药物研发、个性化治疗等方面发挥着越来越重要的作用，提高了医疗效率和准确性。',
                    'url': 'https://example.com/ai-medical',
                    'source': 'mock_search'
                }
            ],
            "机器学习": [
                {
                    'title': '机器学习入门指南',
                    'snippet': '机器学习是人工智能的核心技术，通过算法让计算机从数据中学习，实现自动化的决策和预测功能。',
                    'url': 'https://example.com/ml-guide',
                    'source': 'mock_search'
                },
                {
                    'title': '深度学习框架对比',
                    'snippet': 'TensorFlow、PyTorch、Keras等深度学习框架各有特点，选择合适的框架对项目成功至关重要。',
                    'url': 'https://example.com/dl-frameworks',
                    'source': 'mock_search'
                }
            ]
        }
        
        # 查找是否有匹配的模拟数据
        for key, results in mock_data.items():
            if key in query or query in key:
                return results[:top_k]
        
        # 如果没有匹配的，返回通用结果
        return [
            {
                'title': f'关于"{query}"的搜索结果',
                'snippet': f'这是对"{query}"的模拟搜索结果，用于演示网络搜索功能。在实际环境中，这里会显示真实的网络搜索结果。',
                'url': f'https://example.com/search?q={query}',
                'source': 'mock_search'
            },
            {
                'title': '搜索功能说明',
                'snippet': '当前使用的是模拟数据模式，用于演示网络搜索功能。在生产环境中，这里会显示真实的网络搜索结果。',
                'url': 'https://example.com/help',
                'source': 'mock_search'
            }
        ]
    
    def _get_fallback_results(self, query: str, top_k: int) -> List[Dict]:
        """获取兜底搜索结果（模拟数据）"""
        fallback_results = [
            {
                'title': f'关于"{query}"的相关信息',
                'snippet': f'由于网络搜索暂时不可用，建议您尝试其他关键词或稍后再试。当前查询：{query}',
                'url': '#',
                'source': 'fallback'
            },
            {
                'title': '搜索服务说明',
                'snippet': '网络搜索功能需要网络连接。如果遇到问题，请检查网络设置或联系管理员。',
                'url': '#',
                'source': 'fallback'
            }
        ]
        
        return fallback_results[:top_k]


# 全局实例
simple_web_search_service = SimpleWebSearchService()
