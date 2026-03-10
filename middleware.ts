// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getToken } from 'next-auth/jwt';

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

  // Protected routes - require login.
  // Accept either legacy app cookie (aivora_session) or NextAuth session token.
  const legacyToken = request.cookies.get('aivora_session')?.value;
  let role: string | undefined;

  if (legacyToken) {
    try {
      const { payload } = await jwtVerify(legacyToken, secretKey);
      role = (payload as { role?: string }).role;
    } catch (error) {
      console.error('Middleware legacy token error:', error);
    }
  }

  if (!role) {
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    role = typeof nextAuthToken?.role === 'string' ? nextAuthToken.role : undefined;
  }

  if (!role) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (legacyToken) response.cookies.delete('aivora_session');
    return response;
  }

  const normalizedRole = role.toLowerCase();

  // Protect admin routes
  if (pathname.startsWith('/dashboard') && normalizedRole !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect teacher routes
  if (pathname.startsWith('/teacher') && normalizedRole !== 'teacher') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect student routes
  if (pathname.startsWith('/student') && normalizedRole !== 'student') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
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
