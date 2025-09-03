'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2 } from 'lucide-react';

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
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-600">请登录您的账户</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">账号</label>
            <input 
              className="w-full rounded-lg border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all duration-150" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input 
              type="password" 
              className="w-full rounded-lg border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all duration-150" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
            />
          </div>
          
          <button 
            disabled={loading} 
            className="w-full rounded-lg bg-gray-900 text-white py-3 px-4 border border-gray-900 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>登录中...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>登录</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

