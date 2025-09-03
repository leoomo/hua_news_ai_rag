'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { Search, Loader2 } from 'lucide-react';
import { useNotification, NotificationContainer } from '@/components/Notification';

type SearchResult = {
  id: number | string;
  title: string;
  snippet?: string;
  source_url?: string;
  score?: number;
};

type WebSearchResult = {
  query: string;
  source: string;
  summary?: string;
  web_results: Array<{
    title: string;
    snippet: string;
    url: string;
    source: string;
  }>;
};

type SearchResponse = {
  code: number;
  data: SearchResult[];
  message: string;
  web_search?: WebSearchResult;
};

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [webSearch, setWebSearch] = useState<WebSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 使用通知管理器
  const notification = useNotification();

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    
    // 防止重复点击
    if (loading) return;
    
    // 验证搜索内容（避免过短、含糊查询导致噪声过大）
    const text = q.trim();
    const isCJK = /[\u4e00-\u9fff]/.test(text);
    const minLen = isCJK ? 2 : 3;
    if (!text || text.length < minLen) {
      notification.showWarning('搜索提示', `请输入至少 ${minLen} 个字符的关键词`);
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    setWebSearch(null); // 清空之前的网络搜索结果
    
    try {
      const res = await api.post('/api/search/semantic', { query: text, top_k: 10 });
      
      // 处理本地搜索结果
      setResults(res.data?.data || res.data || []);
      
      // 处理网络搜索结果
      if (res.data?.web_search) {
        setWebSearch(res.data.web_search);
      }
      
      if (res.data?.data?.length > 0 || res.data?.length > 0) {
        notification.showSuccess('搜索完成', `找到 ${res.data?.data?.length || res.data?.length || 0} 条相关结果`);
      } else if (res.data?.web_search) {
        notification.showInfo('搜索完成', '本地知识库未找到相关内容，已为您联网查询');
      } else {
        notification.showInfo('搜索完成', '未找到相关内容，请尝试其他关键词');
      }
    } catch (error: any) {
      // 显示错误信息
      let errorMessage = '搜索失败';
      if (error.response?.data?.msg) {
        errorMessage += `: ${error.response.data.msg}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage += ': 网络连接失败，请检查后端服务是否正常运行';
      } else {
        errorMessage += ': 未知错误，请稍后重试';
      }
      notification.showError('搜索失败', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <main className="space-y-4">
        {/* 通知容器 */}
        <NotificationContainer notifications={notification.notifications} />
        
        <h1 className="text-2xl font-semibold">语义搜索</h1>
        <form onSubmit={onSearch} className="flex gap-2 max-w-2xl mx-auto">
          <input 
            className="flex-1 rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="请输入问题..." 
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading}
            className={`rounded-md px-4 py-2 flex items-center gap-2 border transition-all duration-150 ${
              loading
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:shadow hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>搜索中...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>搜索</span>
              </>
            )}
          </button>
        </form>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>正在检索相关内容...</span>
            </div>
          </div>
        ) : (
          <>
            {/* 本地搜索结果 */}
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  找到 {results.length} 条本地相关结果
                </div>
                <ul className="space-y-2">
                  {results.map((r) => (
                    <li key={r.id} className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{r.title}</h3>
                        {typeof r.score === 'number' && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            相似度: {r.score.toFixed(3)}
                          </span>
                        )}
                      </div>
                      {r.snippet && (
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          {r.snippet}
                        </p>
                      )}
                      {r.source_url && (
                        <div className="mt-2">
                          <a 
                            className="text-sm text-gray-700 hover:text-gray-900 hover:underline inline-flex items-center gap-1" 
                            href={r.source_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            查看来源 →
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 网络搜索结果 */}
            {webSearch && webSearch.web_results && webSearch.web_results.length > 0 && (
              <div className="space-y-2 mt-6">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>🌐 网络搜索结果</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {webSearch.source}
                  </span>
                </div>
                {webSearch.summary && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-sm text-gray-800">{webSearch.summary}</p>
                  </div>
                )}
                <ul className="space-y-2">
                  {webSearch.web_results.map((r, index) => (
                    <li key={index} className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{r.title}</h3>
                        <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {r.source}
                        </span>
                      </div>
                      {r.snippet && (
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          {r.snippet}
                        </p>
                      )}
                      {r.url && r.url !== '#' && (
                        <div className="mt-2">
                          <a 
                            className="text-sm text-gray-700 hover:text-gray-900 hover:underline inline-flex items-center gap-1" 
                            href={r.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            访问网站 →
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {hasSearched && results.length === 0 && !webSearch && !loading && q.trim() && (
              <div className="text-center py-8 text-gray-500">
                <p>未找到相关内容</p>
                <p className="text-sm mt-1">请尝试使用其他关键词或调整搜索条件</p>
              </div>
            )}
          </>
        )}
      </main>
    </Protected>
  );
}

