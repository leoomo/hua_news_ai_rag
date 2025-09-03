"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type KeywordRow = { keyword: string; count: number };
type TrendRow = { date: string; count: number };

export default function AnalyticsPage() {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [k, t] = await Promise.all([
          api.get('/api/analytics/keywords_top'),
          api.get('/api/analytics/trend?days=14'),
        ]);
        setKeywords(k.data?.data || k.data || []);
        setTrend(t.data?.data || t.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">数据分析</h1>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <>
          <div className="rounded border bg-white p-4">
            <h2 className="font-medium mb-3">关键词 Top10</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">关键词</th>
                  <th className="text-left p-2">出现次数</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((r) => (
                  <tr key={r.keyword} className="border-t">
                    <td className="p-2">{r.keyword}</td>
                    <td className="p-2">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded border bg-white p-4">
            <h2 className="font-medium mb-3">近14天文章数量趋势</h2>
            <div className="mb-3 text-xs text-gray-600">
              总计：{trend.reduce((s, x) => s + x.count, 0)}，日均：{Math.round(trend.reduce((s, x) => s + x.count, 0) / Math.max(1, trend.length))}
            </div>
            {(() => {
              const maxV = Math.max(1, ...trend.map(t => t.count));
              const barMaxH = 120; // px
              return (
                <div className="flex items-end gap-3 overflow-x-auto py-2">
                  {trend.map((d) => {
                    const h = Math.max(4, Math.round((d.count / maxV) * barMaxH));
                    const dt = new Date(d.date);
                    const label = isNaN(dt.getTime())
                      ? d.date
                      : dt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/-/g, '/');
                    return (
                      <div key={d.date} className="text-center min-w-[28px]" title={`${label}：${d.count}`}>
                        <div className="text-[11px] text-gray-600 mb-1">{d.count}</div>
                        <div className="mx-auto w-3.5 bg-gray-800 hover:bg-blue-600 transition-colors" style={{ height: h }} />
                        <div className="text-[10px] text-gray-400 mt-1">{label}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </main>
  );
}

