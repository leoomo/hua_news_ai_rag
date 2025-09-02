import { NextResponse } from 'next/server';

const mockItems = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  title: `示例新闻标题 ${i + 1}`,
  source_name: 'RSS示例',
  category: 'general',
  created_at: '2025-01-01 10:00:00',
}));

export async function GET() {
  return NextResponse.json({ code: 0, data: mockItems });
}


