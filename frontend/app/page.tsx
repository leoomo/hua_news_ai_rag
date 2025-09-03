"use client";
import { useEffect, useState } from 'react';
import { Protected } from '@/components/Protected';
import { api } from '@/lib/api';

type Latest = { id: number; title: string; source_name?: string; created_at?: string };
type Last7 = { date: string; count: number };

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [latest, setLatest] = useState<Latest[]>([]);
  const [last7, setLast7] = useState<Last7[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/dashboard/summary', {
          // 防缓存
          headers: { 'Cache-Control': 'no-cache' },
          params: { t: Date.now() },
        });
        const d = res.data?.data || res.data || {};
        setTotal(d.total_articles || 0);
        setLatest(d.latest || []);
        setLast7(d.last7 || []);
      } finally {
        setLoading(false);
      }
    }

    load();

    // 监听知识库变更事件
    const onKbChanged = (e: Event) => {
      // 若删除方已提供最新总数，先行更新避免闪烁
      const detail = (e as CustomEvent)?.detail as { total?: number } | undefined;
      if (detail && typeof detail.total === 'number') {
        setTotal(detail.total);
      }
      setLoading(true);
      load();
    };
    window.addEventListener('kb:changed', onKbChanged);

    // 页面获得焦点时刷新
    const onFocus = () => {
      setLoading(true);
      load();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('kb:changed', onKbChanged);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <Protected>
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        {loading ? (
          <p>加载中...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: 'calc(90vh - 8rem)' }}>
              <div className="rounded border bg-white p-4 h-full flex flex-col">
                <div className="text-sm text-gray-500">文章总数</div>
                <div className="text-3xl font-semibold mt-1">{total}</div>
              </div>
              <div className="rounded border bg-white p-4 h-full flex flex-col">
                <div className="text-sm text-gray-500 mb-2">最新 8 篇</div>
                <ul className="divide-y divide-gray-100 overflow-auto pr-1 flex-1">
                  {latest.map((a) => (
                    <li key={a.id} className="py-2 first:pt-0 last:pb-0">
                      <div className="group flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-150 line-clamp-2" title={a.title}>
                            {a.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              {a.source_name || '未知来源'}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>
                              {(() => {
                                const dt = a.created_at ? new Date(a.created_at) : null;
                                if (!dt || isNaN(dt.getTime())) return '-';
                                return dt.toLocaleString('zh-CN', {
                                  timeZone: 'Asia/Shanghai',
                                  year: '2-digit',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                }).replace(/-/g, '/');
                              })()}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-blue-200 group-hover:bg-blue-400 transition-colors duration-150" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded border bg-white p-4 h-full flex flex-col">
                <div className="text-sm text-gray-500 mb-2">最近 7 天入库</div>
                <div className="overflow-hidden flex-1">
                  <div className="grid grid-cols-7 gap-2 items-end h-full">
                  {last7.map((d) => (
                    <div key={d.date} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{d.count}</div>
                      <div className="bg-gray-800 mx-auto" style={{ height: Math.max(4, d.count * 3), width: 12 }} />
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {(() => {
                          const dt = new Date(d.date);
                          if (isNaN(dt.getTime())) return d.date;
                          return dt.toLocaleDateString('zh-CN', {
                            timeZone: 'Asia/Shanghai',
                            month: '2-digit',
                            day: '2-digit'
                          }).replace(/-/g, '/');
                        })()}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </Protected>
  );
}

