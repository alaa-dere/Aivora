import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear legacy app session cookie
    response.cookies.set('aivora_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    // Clear NextAuth cookies as fallback
    const secure = process.env.NODE_ENV === 'production';
    const nextAuthCookies = secure
      ? ['__Secure-next-auth.session-token', '__Secure-next-auth.callback-url', '__Host-next-auth.csrf-token']
      : ['next-auth.session-token', 'next-auth.callback-url', 'next-auth.csrf-token'];

    for (const name of nextAuthCookies) {
      response.cookies.set(name, '', {
        httpOnly: name.includes('session-token') || name.includes('csrf-token'),
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Error occurred while logging out' },
      { status: 500 }
    );
  }
}
