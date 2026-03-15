import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id FROM User WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      );
    }

    const userId = users[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query('DELETE FROM PasswordResetToken WHERE userId = ?', [userId]);
    await db.query(
      'INSERT INTO PasswordResetToken (id, userId, token, expiresAt) VALUES (UUID(), ?, ?, ?)',
      [userId, token, expiresAt]
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const emailFrom = process.env.EMAIL_FROM || emailUser;

    if (!emailFrom) {
      console.error('Forgot password mail config error: EMAIL_FROM or EMAIL_USER is required');
      return NextResponse.json(
        { message: 'Mail server is not configured. Set EMAIL_USER/EMAIL_PASS (or SMTP_*) in .env.' },
        { status: 500 }
      );
    }

    if (!smtpHost && (!emailUser || !emailPass)) {
      return NextResponse.json(
        { message: 'Missing EMAIL_USER/EMAIL_PASS for Gmail transport in .env.' },
        { status: 500 }
      );
    }

    const transporter = smtpHost
      ? nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
        })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

    await transporter.verify();

    await transporter.sendMail({
      from: `"Aivora Support" <${emailFrom}>`,
      to: normalizedEmail,
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
      { message: 'Password reset link sent. Check your inbox and spam folder.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
