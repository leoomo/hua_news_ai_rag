import requests
import json
from typing import List, Dict, Optional
from config import Settings


class WebSearchService:
    """网络搜索服务，支持百度搜索API"""
    
    def __init__(self):
        self.settings = Settings()
        self.baidu_api_key = getattr(self.settings, 'baidu_api_key', None)
        self.baidu_secret_key = getattr(self.settings, 'baidu_secret_key', None)
        self.baidu_access_token = None
    
    def _get_baidu_token(self) -> Optional[str]:
        """获取百度API访问令牌"""
        if not self.baidu_api_key or not self.baidu_secret_key:
            return None
            
        if self.baidu_access_token:
            return self.baidu_access_token
            
        try:
            url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={self.baidu_api_key}&client_secret={self.baidu_secret_key}"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.baidu_access_token = data.get('access_token')
                return self.baidu_access_token
        except Exception as e:
            print(f"获取百度token失败: {e}")
        return None
    
    def search_baidu(self, query: str, top_k: int = 3) -> List[Dict]:
        """使用百度搜索API搜索"""
        if not self._get_baidu_token():
            return []
            
        try:
            url = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/plugin/1/eb-instant"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.baidu_access_token}"
            }
            
            payload = {
                "query": query,
                "plugins": ["web_search"],
                "stream": False
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            if response.status_code == 200:
                data = response.json()
                results = []
                
                # 解析百度搜索结果
                if 'result' in data and 'web_search' in data['result']:
                    web_results = data['result']['web_search']
                    for item in web_results[:top_k]:
                        results.append({
                            'title': item.get('title', ''),
                            'snippet': item.get('snippet', ''),
                            'url': item.get('url', ''),
                            'source': 'baidu'
                        })
                
                return results
        except Exception as e:
            print(f"百度搜索失败: {e}")
        
        return []
    
    def search_web(self, query: str, top_k: int = 3) -> List[Dict]:
        """通用网络搜索接口"""
        # 优先使用百度API
        results = self.search_baidu(query, top_k)
        
        # 如果百度API失败，可以添加其他搜索源作为备选
        if not results:
            # 这里可以添加其他搜索源，如Google、Bing等
            pass
            
        return results


# 全局实例
web_search_service = WebSearchService()
