from typing import List, Dict, Optional
from config import Settings


class AISummaryService:
    """AI总结服务，使用大语言模型对网络搜索结果进行总结"""
    
    def __init__(self):
        self.settings = Settings()
        self._llm = None
    
    def _get_llm(self):
        """获取大语言模型实例"""
        if self._llm is None:
            try:
                from langchain_community.llms import Ollama
                self._llm = Ollama(model="qwen2.5:3b", temperature=0.3)
            except ImportError:
                print("LangChain未安装，无法使用AI总结功能")
                return None
        return self._llm
    
    def summarize_web_results(self, query: str, web_results: List[Dict]) -> Optional[str]:
        """对网络搜索结果进行AI总结"""
        if not web_results:
            return None
            
        llm = self._get_llm()
        if not llm:
            return None
        
        try:
            # 构建提示词
            context = "\n\n".join([
                f"标题: {result['title']}\n摘要: {result['snippet']}\n来源: {result['url']}"
                for result in web_results
            ])
            
            prompt = f"""基于以下网络搜索结果，为用户查询"{query}"提供一个简洁、准确的中文总结。

搜索结果：
{context}

请提供：
1. 核心信息总结（2-3句话）
2. 关键要点（3-4个要点）
3. 信息来源说明

总结："""
            
            # 调用LLM进行总结
            response = llm.invoke(prompt)
            return response.strip() if response else None
            
        except Exception as e:
            print(f"AI总结失败: {e}")
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
