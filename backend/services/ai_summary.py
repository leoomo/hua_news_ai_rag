from typing import List, Dict, Optional
from config import Settings


class AISummaryService:
    """AI总结服务，对网络搜索结果进行智能总结"""
    
    def __init__(self):
        self.settings = Settings()
    
    def _extract_key_info(self, text: str, max_length: int = 100) -> str:
        """提取文本中的关键信息"""
        if not text:
            return ""
        
        # 移除HTML标签和多余空格
        import re
        clean_text = re.sub(r'<[^>]+>', '', text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # 如果文本较短，直接返回
        if len(clean_text) <= max_length:
            return clean_text
        
        # 尝试在句号处截断
        sentences = clean_text.split('。')
        result = ""
        for sentence in sentences:
            if len(result + sentence) <= max_length:
                result += sentence + "。"
            else:
                break
        
        # 如果没有句号或截断后为空，则按字符截断
        if not result:
            result = clean_text[:max_length] + "..."
        
        return result
    
    def summarize_web_results(self, query: str, web_results: List[Dict]) -> Optional[str]:
        """对网络搜索结果进行智能总结"""
        if not web_results:
            return None
        
        try:
            # 提取关键信息
            titles = []
            snippets = []
            sources = []
            
            for result in web_results:
                if result.get('title'):
                    titles.append(result['title'])
                if result.get('snippet') and result['snippet'] != '暂无摘要':
                    snippets.append(result['snippet'])
                if result.get('source'):
                    sources.append(result['source'])
            
            # 生成总结
            summary_parts = []
            
            # 1. 核心信息总结
            if titles:
                title_summary = f"找到 {len(titles)} 个相关结果，主要涉及：{', '.join(titles[:3])}"
                summary_parts.append(title_summary)
            
            # 2. 关键要点
            if snippets:
                # 选择最长的摘要作为主要信息
                main_snippet = max(snippets, key=len) if snippets else ""
                if main_snippet:
                    key_info = self._extract_key_info(main_snippet, 80)
                    summary_parts.append(f"主要信息：{key_info}")
            
            # 3. 信息来源说明
            if sources:
                unique_sources = list(set(sources))
                source_info = f"信息来源：{', '.join(unique_sources)}"
                summary_parts.append(source_info)
            
            # 4. 建议
            summary_parts.append("建议：您可以点击下方链接访问相关网站获取更详细信息。")
            
            return " ".join(summary_parts)
            
        except Exception as e:
            print(f"智能总结失败: {e}")
            return None
    
    def generate_enhanced_response(self, query: str, web_results: List[Dict]) -> Dict:
        """生成增强的搜索结果响应"""
        summary = self.summarize_web_results(query, web_results)
        
        return {
            'summary': summary,
            'web_results': web_results,
            'source': 'web_search',
            'query': query
        }


# 全局实例
ai_summary_service = AISummaryService()
