'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      setAuthToken(res.data.token);
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.msg || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white p-6 rounded border">
        <h1 className="text-xl font-semibold">登录</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm mb-1">账号</label>
          <input className="w-full rounded border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">{loading ? '登录中...' : '登录'}</button>
      </form>
    </main>
  );
}

