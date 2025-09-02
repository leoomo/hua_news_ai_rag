import { NextResponse } from 'next/server';

type User = { id: number; username: string; email: string; role: 'user' | 'editor' | 'admin' };

let usersStore: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
  { id: 2, username: 'editor', email: 'editor@example.com', role: 'editor' },
  { id: 3, username: 'user', email: 'user@example.com', role: 'user' },
];

export async function GET() {
  return NextResponse.json({ code: 0, data: usersStore });
}

export async function POST(req: Request) {
  const body = await req.json();
  const id = Math.max(0, ...usersStore.map((u) => u.id)) + 1;
  const user: User = { id, username: body.username, email: body.email, role: body.role };
  usersStore.push(user);
  return NextResponse.json({ code: 0, data: user });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id } = body;
  const idx = usersStore.findIndex((u) => u.id === id);
  if (idx < 0) return NextResponse.json({ code: 404, msg: 'Not Found' }, { status: 404 });
  usersStore[idx] = { ...usersStore[idx], ...body };
  return NextResponse.json({ code: 0, data: usersStore[idx] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const before = usersStore.length;
  usersStore = usersStore.filter((u) => u.id !== id);
  if (before === usersStore.length) return NextResponse.json({ code: 404, msg: 'Not Found' }, { status: 404 });
  return NextResponse.json({ code: 0, data: { id } });
}


