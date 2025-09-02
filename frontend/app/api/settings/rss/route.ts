import { NextResponse } from 'next/server';

type Rss = { id: number; name: string; url: string; category?: string; is_active?: boolean };

let rssStore: Rss[] = [
  { id: 1, name: '新华社', url: 'https://www.xinhuanet.com/rss', category: 'china', is_active: true },
  { id: 2, name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'world', is_active: true },
  { id: 3, name: 'Reuters Top', url: 'http://feeds.reuters.com/reuters/topNews', category: 'world', is_active: true },
];

export async function GET() {
  return NextResponse.json({ code: 0, data: rssStore });
}

export async function POST(req: Request) {
  const body = await req.json();
  const id = Math.max(0, ...rssStore.map((r) => r.id)) + 1;
  const item: Rss = { id, name: body.name, url: body.url, category: body.category || '', is_active: !!body.is_active };
  rssStore.push(item);
  return NextResponse.json({ code: 0, data: item });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id } = body;
  const idx = rssStore.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ code: 404, msg: 'Not Found' }, { status: 404 });
  rssStore[idx] = { ...rssStore[idx], ...body };
  return NextResponse.json({ code: 0, data: rssStore[idx] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const before = rssStore.length;
  rssStore = rssStore.filter((r) => r.id !== id);
  if (rssStore.length === before) return NextResponse.json({ code: 404, msg: 'Not Found' }, { status: 404 });
  return NextResponse.json({ code: 0, data: { id } });
}


