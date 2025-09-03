'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearAuthToken, getAuthToken } from '@/lib/auth';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: '仪表盘' },
  { href: '/kb', label: '知识库' },
  { href: '/search', label: '搜索' },
  { href: '/analytics', label: '分析' },
  { href: '/settings/rss', label: 'RSS' },
  { href: '/settings/models', label: '模型' },
  { href: '/settings/users', label: '用户' },
  { href: '/settings/system', label: '系统' },
];

export function Nav() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(!!getAuthToken());
  }, [pathname]);
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1.5 rounded-md border transition-all duration-150 ${
            pathname === l.href
              ? 'bg-gray-900 text-white border-gray-900 shadow'
              : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5'
          }`}
        >
          {l.label}
        </Link>
      ))}
      <div className="ml-auto" />
      {authed ? (
        <button
          onClick={() => { clearAuthToken(); location.href = '/login'; }}
          className="px-3 py-1.5 rounded-md border border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-50 transition-all duration-150"
        >
          退出登录
        </button>
      ) : (
        <Link
          href="/login"
          className={`px-3 py-1.5 rounded-md border transition-all duration-150 ${
            pathname === '/login'
              ? 'bg-gray-900 text-white border-gray-900 shadow'
              : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5'
          }`}
        >
          登录
        </Link>
      )}
    </nav>
  );
}

