'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ModelsCfg = { llm: string; embedding: string; reranker?: string; ollama_url?: string };

export default function ModelsSettingsPage() {
  const [cfg, setCfg] = useState<ModelsCfg>({ llm: '', embedding: '' });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api.get('/api/settings/models').then((res) => setCfg(res.data?.data || res.data));
  }, []);
  async function onSave() {
    await api.put('/api/settings/models', cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">模型与 API 设置</h1>
      <div className="rounded border bg-white p-4 space-y-3 max-w-xl">
        <div>
          <label className="block text-sm mb-1">LLM</label>
          <input className="w-full rounded border px-3 py-2" value={cfg.llm} onChange={(e) => setCfg({ ...cfg, llm: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Embedding</label>
          <input className="w-full rounded border px-3 py-2" value={cfg.embedding} onChange={(e) => setCfg({ ...cfg, embedding: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Reranker</label>
          <input className="w-full rounded border px-3 py-2" value={cfg.reranker || ''} onChange={(e) => setCfg({ ...cfg, reranker: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Ollama URL</label>
          <input className="w-full rounded border px-3 py-2" value={cfg.ollama_url || ''} onChange={(e) => setCfg({ ...cfg, ollama_url: e.target.value })} />
        </div>
        <button onClick={onSave} className="rounded bg-black text-white px-4 py-2">保存</button>
        {saved && <span className="text-green-600 text-sm">已保存</span>}
      </div>
    </main>
  );
}

