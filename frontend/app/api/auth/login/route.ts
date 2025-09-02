import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (username === 'admin' && password === 'admin123') {
      const token = 'mock-token-admin';
      const res = NextResponse.json({ token });
      res.cookies.set('token', token, { httpOnly: false, sameSite: 'lax', path: '/' });
      return res;
    }

    return NextResponse.json({ code: 401, msg: '用户名或密码错误' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ code: 400, msg: 'Bad Request' }, { status: 400 });
  }
}


