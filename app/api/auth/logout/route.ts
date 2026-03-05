// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'logged out successfully' });

  // حذف الكوكي بشكل آمن
  response.cookies.set('aivora_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',       // ← غيّرناها strict لأمان أكبر
    path: '/',
    maxAge: 0,                // يحذف الكوكي فورًا
  });

  // اختياري: redirect لصفحة اللوجن (أفضل تجربة مستخدم)
  // response.headers.set('Location', '/login');
  // response.status = 302;

  return response;
}