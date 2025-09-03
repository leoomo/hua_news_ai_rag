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

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
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
    try {
      const res = await api.post('/api/search/semantic', { query: text, top_k: 10 });
      setResults(res.data?.data || res.data || []);
      
      if (res.data?.data?.length > 0 || res.data?.length > 0) {
        notification.showSuccess('搜索完成', `找到 ${res.data?.data?.length || res.data?.length || 0} 条相关结果`);
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
        <form onSubmit={onSearch} className="flex gap-2">
          <input 
            className="flex-1 rounded border px-3 py-2" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="请输入问题..." 
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading}
            className={`rounded px-4 py-2 flex items-center gap-2 transition-all duration-200 ${
              loading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-md'
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
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  找到 {results.length} 条相关结果
                </div>
                <ul className="space-y-2">
                  {results.map((r) => (
                    <li key={r.id} className="rounded border bg-white p-3 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{r.title}</h3>
                        {typeof r.score === 'number' && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            相似度: {r.score.toFixed(3)}
                          </span>
                        )}
                      </div>
                      {r.snippet && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {r.snippet}
                        </p>
                      )}
                      {r.source_url && (
                        <div className="mt-2">
                          <a 
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1" 
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
            
            {hasSearched && results.length === 0 && !loading && q.trim() && (
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

