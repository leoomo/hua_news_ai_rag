'use client';
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';

type ModelsCfg = { llm: string; embedding: string; reranker?: string; ollama_url?: string };

export default function ModelsSettingsPage() {
  const [cfg, setCfg] = useState<ModelsCfg>({ llm: '', embedding: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 自动清除消息
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    api.get('/api/settings/models').then((res) => setCfg(res.data?.data || res.data));
  }, []);

  async function onSave() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put('/api/settings/models', cfg);
      if (res.data?.code === 0) {
        setSuccess('模型配置保存成功');
      } else {
        setError(res.data?.msg || '保存失败');
      }
    } catch (error: any) {
      setError(error.response?.data?.msg || error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">模型与 API 设置</h1>
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-4 space-y-3 max-w-xl shadow-sm">
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        <div>
          <label className="block text-sm mb-1">LLM</label>
          <input className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" value={cfg.llm} onChange={(e) => setCfg({ ...cfg, llm: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Embedding</label>
          <input className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" value={cfg.embedding} onChange={(e) => setCfg({ ...cfg, embedding: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Reranker</label>
          <input className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" value={cfg.reranker || ''} onChange={(e) => setCfg({ ...cfg, reranker: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Ollama URL</label>
          <input className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" value={cfg.ollama_url || ''} onChange={(e) => setCfg({ ...cfg, ollama_url: e.target.value })} />
        </div>
        <button 
          onClick={onSave} 
          disabled={loading}
          className={`rounded-md border px-4 py-2 border-gray-900 transition-all duration-150 flex items-center gap-2 ${
            loading 
              ? 'bg-gray-500 text-white cursor-not-allowed' 
              : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <Save className="w-4 h-4" />
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </main>
  );
}

