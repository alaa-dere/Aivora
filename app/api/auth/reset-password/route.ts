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

    // Ø¬Ù„Ø¨ Ø§Ù„Ù€ token Ù…Ù† Ø§Ù„Ø¯Ø§ØªØ§Ø¨ÙŠØ²
    const [tokens] = await db.query<RowDataPacket[]>(
      'SELECT userId, expiresAt FROM passwordresettoken WHERE token = ?',
      [token]
    );

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    const { userId, expiresAt } = tokens[0];

    // ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©
    if (new Date(expiresAt) < new Date()) {
      await db.query('DELETE FROM passwordresettoken WHERE token = ?', [token]);
      return NextResponse.json({ message: 'Token has expired' }, { status: 400 });
    }

    // ØªØ´ÙÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙÙŠ Ø¬Ø¯ÙˆÙ„ User
    await db.query('UPDATE user SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);

    // Ø­Ø°Ù Ø§Ù„Ù€ token Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…
    await db.query('DELETE FROM passwordresettoken WHERE token = ?', [token]);

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}