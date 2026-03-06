import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

    // حذف الكوكي بنفس الاسم المستخدم
    response.cookies.set('aivora_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    // منع التخزين المؤقت
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