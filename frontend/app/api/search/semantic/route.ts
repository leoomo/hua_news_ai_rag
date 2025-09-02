import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { query } = await req.json();
  const data = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    title: `与 “${query}” 相关的结果 ${i + 1}`,
    snippet: '这是一个示例摘要，用于展示检索结果片段。',
    source_url: 'https://example.com',
    score: Math.random(),
  }));
  return NextResponse.json({ code: 0, data });
}


