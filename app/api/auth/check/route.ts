import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT r.name AS role FROM User u JOIN Role r ON u.roleId = r.id WHERE u.email = ?',
      [email]
    );

    if (rows.length > 0) {
      return NextResponse.json({ exists: true, role: rows[0].role });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (err) {
    console.error('Check user error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
