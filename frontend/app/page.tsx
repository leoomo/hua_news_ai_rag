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
        const res = await api.get('/api/dashboard/summary');
        const d = res.data?.data || res.data || {};
        setTotal(d.total_articles || 0);
        setLatest(d.latest || []);
        setLast7(d.last7 || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Protected>
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        {loading ? (
          <p>加载中...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded border bg-white p-4">
                <div className="text-sm text-gray-500">文章总数</div>
                <div className="text-3xl font-semibold mt-1">{total}</div>
              </div>
              <div className="rounded border bg-white p-4">
                <div className="text-sm text-gray-500 mb-2">最近 7 天入库</div>
                <div className="grid grid-cols-7 gap-2 items-end">
                  {last7.map((d) => (
                    <div key={d.date} className="text-center">
                      <div className="bg-gray-800 mx-auto" style={{ height: Math.max(4, d.count * 4), width: 12 }} />
                      <div className="text-xs text-gray-500 mt-1">{d.count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded border bg-white p-4">
                <div className="text-sm text-gray-500 mb-2">最新 5 篇</div>
                <ul className="space-y-1 text-sm">
                  {latest.map((a) => (
                    <li key={a.id} className="truncate">{a.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </Protected>
  );
}

