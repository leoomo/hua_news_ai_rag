'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';

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

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/search/semantic', { query: q, top_k: 10 });
      setResults(res.data?.data || res.data || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected>
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">语义搜索</h1>
        <form onSubmit={onSearch} className="flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="请输入问题..." />
          <button className="rounded bg-black text-white px-4">搜索</button>
        </form>
        {loading ? (
          <p>检索中...</p>
        ) : (
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id} className="rounded border bg-white p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{r.title}</h3>
                  {typeof r.score === 'number' && <span className="text-xs text-gray-500">{r.score.toFixed(3)}</span>}
                </div>
                {r.snippet && <p className="text-sm text-gray-600 mt-1">{r.snippet}</p>}
                {r.source_url && (
                  <a className="text-sm text-blue-600" href={r.source_url} target="_blank">来源</a>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </Protected>
  );
}

