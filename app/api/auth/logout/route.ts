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

    // Clear NextAuth/Auth.js cookies across dev/prod and chunked cookie variants.
    const nextAuthCookieBases = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'authjs.callback-url',
      '__Secure-authjs.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'authjs.csrf-token',
      '__Host-authjs.csrf-token',
      'next-auth.pkce.code_verifier',
      '__Secure-next-auth.pkce.code_verifier',
      'authjs.pkce.code_verifier',
      '__Secure-authjs.pkce.code_verifier',
      'next-auth.state',
      '__Secure-next-auth.state',
      'authjs.state',
      '__Secure-authjs.state',
      'next-auth.nonce',
      '__Secure-next-auth.nonce',
      'authjs.nonce',
      '__Secure-authjs.nonce',
    ];
    const nextAuthCookies = nextAuthCookieBases.flatMap((name) => [
      name,
      ...Array.from({ length: 8 }, (_, index) => `${name}.${index}`),
    ]);

    for (const name of nextAuthCookies) {
      response.cookies.set(name, '', {
        httpOnly:
          name.includes('session-token') ||
          name.includes('csrf-token') ||
          name.includes('pkce') ||
          name.includes('state') ||
          name.includes('nonce'),
        secure: name.startsWith('__Secure-') || name.startsWith('__Host-'),
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
