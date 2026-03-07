// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // جلب اليوزر (حددنا النوع RowDataPacket[])
    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id FROM User WHERE email = ?',
      [email.trim()]
    );

    // لو ما لقيناش يوزر، نرجع نفس الرسالة للأمان (security best practice)
    if (users.length === 0) {
      return NextResponse.json(
        { message: 'If the email exists, a reset link has been sent' },
        { status: 200 }
      );
    }

    const userId = users[0].id;

    // توليد token عشوائي آمن
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ساعة

    // حذف أي tokens قديمة لنفس اليوزر
    await db.query('DELETE FROM PasswordResetToken WHERE userId = ?', [userId]);

    // حفظ الـ token الجديد
    await db.query(
      'INSERT INTO PasswordResetToken (id, userId, token, expiresAt) VALUES (UUID(), ?, ?, ?)',
      [userId, token, expiresAt]
    );

    // رابط إعادة التعيين
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    // إعداد nodemailer (Gmail مثال)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // لازم App Password لو Gmail
      },
    });

    // إرسال الإيميل
    await transporter.sendMail({
      from: `"Aivora Support" <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: 'Reset Your Aivora Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003153;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your Aivora password. Click the button below to set a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #003153; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you did not request this reset, please ignore this email or contact support immediately.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Best regards,<br>Aivora Team
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'If the email exists, a reset link has been sent' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}