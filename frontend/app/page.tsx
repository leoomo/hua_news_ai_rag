"use client";
import { useEffect, useState } from 'react';
import { Protected } from '@/components/Protected';
import { api } from '@/lib/api';

type Latest = { id: number; title: string; source_name?: string; created_at?: string; source_url?: string };
type Last7 = { date: string; count: number };

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [latest, setLatest] = useState<Latest[]>([]);
  const [last7, setLast7] = useState<Last7[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<string | null>(null);
  const [today, setToday] = useState<number>(0);
  const [yesterday, setYesterday] = useState<number>(0);
  const [topCats, setTopCats] = useState<{name: string; count: number}[]>([]);
  const [topSrcs, setTopSrcs] = useState<{name: string; count: number}[]>([]);
  const [topKeywords, setTopKeywords] = useState<{ keyword: string; count: number }[]>([]);

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
        setLatestUpdate(d.latest_update || null);
        setToday(d.today_count || 0);
        setYesterday(d.yesterday_count || 0);
        setTopCats(d.top_categories || []);
        setTopSrcs(d.top_sources || []);
        // 关键词Top10
        try {
          const kwRes = await api.get('/api/analytics/keywords_top', {
            headers: { 'Cache-Control': 'no-cache' },
            params: { limit: 10, t: Date.now() },
          });
          const kwData = kwRes.data?.data || kwRes.data || [];
          setTopKeywords(Array.isArray(kwData) ? kwData : []);
        } catch {
          setTopKeywords([]);
        }
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
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        {loading ? (
          <p>加载中...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ height: 'calc(78vh - 8rem)' }}>
              <div className="rounded-xl border border-gray-100 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 h-full flex flex-col">
                <div className="text-sm text-gray-600 mb-1">文章总数</div>
                <div className="text-3xl font-bold mt-1 tracking-tight text-gray-900 mb-3">{total.toLocaleString()}</div>
                <div className="mt-2 text-xs text-gray-500 mb-4">
                  最近更新时间：{(() => {
                    if (!latestUpdate) return '-';
                    const dt = new Date(latestUpdate);
                    if (isNaN(dt.getTime())) return '-';
                    return dt.toLocaleString('zh-CN', {
                      timeZone: 'Asia/Shanghai',
                      hour12: false,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(/-/g, '/');
                  })()}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-green-100 p-2.5 bg-gradient-to-b from-green-50 to-white shadow-sm">
                    <div className="flex items-center justify-between text-gray-600 mb-1">
                      <span>今日新增</span>
                      {(() => {
                        const diff = today - yesterday;
                        const up = diff >= 0;
                        const color = up ? 'text-green-600' : 'text-red-600';
                        const arrow = up ? '▲' : '▼';
                        return <span className={`${color} text-xs`}>{arrow} {Math.abs(diff)}</span>;
                      })()}
                    </div>
                    <div className="text-base font-semibold text-gray-900 tracking-tight">{today}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-2.5 bg-gradient-to-b from-gray-50 to-white shadow-sm">
                    <div className="text-gray-600 mb-1">昨日新增</div>
                    <div className="text-base font-semibold text-gray-900">{yesterday}</div>
                  </div>
                  <div className="rounded-lg border border-blue-100 p-2.5 bg-gradient-to-b from-blue-50 to-white shadow-sm">
                    <div className="text-gray-600 mb-1">近7天日均</div>
                    <div className="text-base font-semibold text-gray-900">{Math.round((last7.reduce((s, x) => s + x.count, 0) / Math.max(1, last7.length)) || 0)}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500 mb-2 font-medium">分类 Top3</div>
                    <div className="space-y-1.5">
                      {(() => {
                        const maxV = Math.max(1, ...topCats.map(x => x.count));
                        return topCats.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <a href={`/kb?category=${encodeURIComponent(c.name)}`} className="truncate w-18 text-blue-600 hover:underline font-medium" title={c.name}>{c.name}</a>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${Math.max(5, Math.round((c.count / maxV) * 100))}%` }} />
                            </div>
                            <span className="w-8 text-right text-gray-700 font-medium">{c.count}</span>
                          </div>
                        ));
                      })()}
                      {topCats.length === 0 && <div className="text-gray-400">-</div>}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-2 font-medium">来源 Top3</div>
                    <div className="space-y-1.5">
                      {(() => {
                        const maxV = Math.max(1, ...topSrcs.map(x => x.count));
                        return topSrcs.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <a href={`/kb?source=${encodeURIComponent(s.name)}`} className="truncate w-18 text-blue-600 hover:underline font-medium" title={s.name}>{s.name}</a>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: `${Math.max(5, Math.round((s.count / maxV) * 100))}%` }} />
                            </div>
                            <span className="w-8 text-right text-gray-700 font-medium">{s.count}</span>
                          </div>
                        ));
                      })()}
                      {topSrcs.length === 0 && <div className="text-gray-400">-</div>}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2 font-medium">关键词 Top10</div>
                  <div className="space-y-1.5">
                    {(() => {
                      const maxK = Math.max(1, ...topKeywords.map(k => k.count));
                      return topKeywords.map((k, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <a href={`/kb?keyword=${encodeURIComponent(k.keyword)}`} className="truncate w-24 text-blue-600 hover:underline font-medium" title={k.keyword}>{k.keyword}</a>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.max(5, Math.round((k.count / maxK) * 100))}%` }} />
                          </div>
                          <span className="w-6 text-right text-gray-700 font-medium">{k.count}</span>
                        </div>
                      ));
                    })()}
                    {topKeywords.length === 0 && <div className="text-gray-400 text-xs">-</div>}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 h-full flex flex-col">
                <div className="text-sm font-medium text-gray-700 mb-1">最新 8 篇</div>
                <ul className="divide-y divide-gray-100 overflow-auto pr-0 flex-1">
                  {latest.map((a) => (
                    <li key={a.id} className="py-2 first:pt-0 last:pb-0">
                      <div className="group flex items-start justify-between gap-3 rounded-md px-2 hover:bg-gray-50 transition-colors">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-150 line-clamp-2 tracking-tight" title={a.title}>
                            {a.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              {a.source_name || '未知来源'}
                            </span>
                            {a.source_url && (
                              <a
                                href={a.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 shadow-sm"
                                title="打开源链接"
                              >
                                源链接
                              </a>
                            )}
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
                        <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-blue-200 group-hover:bg-blue-400 transition-colors duration-150 shadow-inner" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 h-full flex flex-col">
                <div className="text-sm font-medium text-gray-700 mb-1">最近 7 天入库</div>
                <div className="overflow-hidden flex-1">
                  <div className="grid grid-cols-7 gap-2 items-end h-full">
                  {last7.map((d) => (
                    <div key={d.date} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{d.count}</div>
                      <div className="bg-gradient-to-b from-gray-700 to-gray-900 rounded-md mx-auto shadow-inner" style={{ height: Math.max(4, d.count * 2), width: 10 }} />
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

