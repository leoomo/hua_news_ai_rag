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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-7xl p-4">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}

