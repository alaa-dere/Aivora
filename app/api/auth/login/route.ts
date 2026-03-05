import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'superLongRandomSecret123!@#$%^&*()_+-=abcDEF987654321xyz'
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT u.*, r.name AS role FROM User u JOIN Role r ON u.roleId = r.id WHERE u.email = ?',
      [email]
    );

    console.log("Found users:", users.length);

    if (users.length === 0) {
      return NextResponse.json({ message: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return NextResponse.json({ message: 'الحساب غير نشط' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", passwordMatch);
    
    if (!passwordMatch) {
      return NextResponse.json({ message: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const session = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const token = await new SignJWT(session)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    const response = NextResponse.json({
      success: true,
      user: session,
    });

    response.cookies.set('aivora_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'server error' }, { status: 500 });
  }
}