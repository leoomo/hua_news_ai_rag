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
            <div className="grid grid-cols-14 gap-2 items-end">
              {trend.map((d) => (
                <div key={d.date} className="text-center">
                  <div className="bg-gray-800 mx-auto" style={{ height: Math.max(4, d.count * 4), width: 16 }} />
                  <div className="text-xs text-gray-500 mt-1">{d.count}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

