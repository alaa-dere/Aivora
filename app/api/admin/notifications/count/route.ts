import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestRole } from '@/lib/request-auth';

type CountRow = RowDataPacket & { total: number };

export async function GET(req: Request) {
  const role = await getRequestRole(req);
  if (role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM admin_notification
      WHERE readAt IS NULL
      `
    );
    return NextResponse.json({ total: Number(rows[0]?.total || 0) });
  } catch (error: any) {
    console.error('Admin notifications count error:', error);
    return NextResponse.json(
      { message: 'Failed to load notifications count', error: error.message },
      { status: 500 }
    );
  }
}
