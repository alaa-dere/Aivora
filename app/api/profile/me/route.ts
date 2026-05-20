import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, fullName, email, imageUrl FROM user WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        imageUrl: row.imageUrl || null,
      },
    });
  } catch (error: any) {
    console.error('Profile me error:', error);
    return NextResponse.json(
      { message: 'Failed to load profile', error: error.message },
      { status: 500 }
    );
  }
}
