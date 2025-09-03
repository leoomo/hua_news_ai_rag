import './globals.css';
import React from 'react';
import { Nav } from '@/components/Nav';

export const metadata = {
  title: 'HUA News AI RAG',
  description: 'Personalized News Knowledge Base',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-gray-900 bg-[radial-gradient(1000px_800px_at_20%_0%,#eceff3_0%,#e3e7ee_40%,#dde3eb_100%)]">
        <div className="mx-auto max-w-7xl p-4">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}

