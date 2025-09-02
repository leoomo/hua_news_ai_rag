'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';

type KbItem = {
  id: number;
  title: string;
  content?: string;
  source_name?: string;
  category?: string;
  created_at?: string;
  summary?: string | null;
};

export default function KbListPage() {
  const [items, setItems] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/kb/items')
      .then((res) => setItems(res.data?.data || res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Protected>
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">知识库</h1>
        {loading ? (
          <p>加载中...</p>
        ) : (
          <div className="rounded border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">标题</th>
                  <th className="text-left p-2">内容</th>
                  <th className="text-left p-2">摘要</th>
                  <th className="text-left p-2">来源</th>
                  <th className="text-left p-2">分类</th>
                  <th className="text-left p-2">时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">{it.title}</td>
                    <td className="p-2 text-gray-700 max-w-[500px] truncate" title={it.content || ''}>{it.content || '-'}</td>
                    <td className="p-2 text-gray-600 max-w-[500px] truncate" title={it.summary || ''}>{it.summary || '-'}</td>
                    <td className="p-2">{it.source_name || '-'}</td>
                    <td className="p-2">{it.category || '-'}</td>
                    <td className="p-2">{it.created_at || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </Protected>
  );
}

