// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'superLongRandomSecret123!@#$%^&*()_+-=abcDEF987654321xyz'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - allowed for everyone (حتى لو مسجل دخول، ما نعملش redirect)
  const publicPaths = ['/login', '/signup'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // ← التعديل المهم: نرجع next() دايمًا بدون أي redirect
    return NextResponse.next();
  }

  // Protected routes - require login
  const token = request.cookies.get('aivora_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const session = payload as { id: string; email: string; role: string; fullName: string };

    // Protect admin routes
    if (pathname.startsWith('/dashboard') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect teacher routes
    if (pathname.startsWith('/teacher') && session.role !== 'teacher') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect student routes
    if (pathname.startsWith('/student') && session.role !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware token error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('aivora_session');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/login',
    '/signup',
  ],
};