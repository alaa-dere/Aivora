// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const cookie = request.cookies.get('aivora_session')?.value;

    if (!cookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const session = JSON.parse(cookie);
      if (session.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};