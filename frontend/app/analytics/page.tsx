"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type KeywordRow = { keyword: string; count: number };
type TrendRow = { date: string; count: number };
type SourceSeries = { name: string; data: number[] };

export default function AnalyticsPage() {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);
  const [sourcesSeries, setSourcesSeries] = useState<SourceSeries[]>([]);
  const [failTop, setFailTop] = useState<{error: string; count: number}[]>([]);
  const [heat, setHeat] = useState<number[][]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [k, t, s, f, h] = await Promise.all([
          api.get('/api/analytics/keywords_top'),
          api.get('/api/analytics/trend?days=14'),
          api.get('/api/analytics/sources_trend?days=14&topk=5'),
          api.get('/api/analytics/failures_top?days=14'),
          api.get('/api/analytics/hour_week_heat?days=14'),
        ]);
        setKeywords(k.data?.data || k.data || []);
        setTrend(t.data?.data || t.data || []);
        setDates(s.data?.data?.dates || []);
        setSourcesSeries(s.data?.data?.series || []);
        setFailTop(f.data?.data || []);
        setHeat(h.data?.data?.matrix || []);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </div>
        </>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded border bg-white p-4">
          <h2 className="font-medium mb-3">来源Top趋势（近14天）</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1">来源</th>
                  {dates.map(d => (
                    <th key={d} className="text-center p-1">{new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourcesSeries.map(s => (
                  <tr key={s.name}>
                    <td className="p-1 text-gray-700 whitespace-nowrap">{s.name || '-'}</td>
                    {s.data.map((v, i) => (
                      <td key={i} className="text-center p-1 text-gray-700">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="font-medium mb-3">失败原因 Top（近14天）</h2>
          <ul className="space-y-1 text-sm">
            {failTop.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs">{r.count}</span>
                <span className="truncate" title={r.error}>{r.error}</span>
              </li>
            ))}
            {failTop.length === 0 && <li className="text-gray-400 text-sm">暂无数据</li>}
          </ul>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-medium mb-3">时段热力图（近14天，周日为0）</h2>
        <div className="overflow-auto">
          <table className="text-[11px]">
            <thead>
              <tr>
                <th className="p-1">周/时</th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} className="p-1 text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heat.map((row, w) => (
                <tr key={w}>
                  <td className="p-1 text-right text-gray-500">{w}</td>
                  {row.map((v, h) => {
                    const alpha = Math.min(1, v / Math.max(1, ...row));
                    return (
                      <td key={h} className="p-0">
                        <div title={`周${w} 时${h}：${v}`} style={{ width: 16, height: 16, backgroundColor: `rgba(37,99,235,${alpha || 0})` }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

