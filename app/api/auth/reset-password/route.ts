// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // جلب الـ token من الداتابيز
    const [tokens] = await db.query<RowDataPacket[]>(
      'SELECT userId, expiresAt FROM PasswordResetToken WHERE token = ?',
      [token]
    );

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    const { userId, expiresAt } = tokens[0];

    // تحقق من الصلاحية
    if (new Date(expiresAt) < new Date()) {
      await db.query('DELETE FROM PasswordResetToken WHERE token = ?', [token]);
      return NextResponse.json({ message: 'Token has expired' }, { status: 400 });
    }

    // تشفير كلمة المرور الجديدة
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // تحديث كلمة المرور في جدول User
    await db.query('UPDATE User SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);

    // حذف الـ token بعد الاستخدام
    await db.query('DELETE FROM PasswordResetToken WHERE token = ?', [token]);

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}