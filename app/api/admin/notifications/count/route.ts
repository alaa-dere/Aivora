import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin } from '@/lib/request-auth';
import { hasUnifiedNotificationTable } from '@/lib/notifications-unified';

type CountRow = RowDataPacket & { total: number };

export async function GET(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const useUnified = await hasUnifiedNotificationTable();
    const [rows] = await pool.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM ${useUnified ? 'notification' : 'admin_notification'}
      WHERE readAt IS NULL
      ${useUnified ? "AND recipientRole = 'admin' AND deletedAt IS NULL" : ''}
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
