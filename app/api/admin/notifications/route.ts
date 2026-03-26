import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestRole } from '@/lib/request-auth';

type NotificationRow = RowDataPacket & {
  id: string;
  type: 'student_signup' | 'course_enroll';
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
};

export async function GET(req: Request) {
  const role = await getRequestRole(req);
  if (role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    const where =
      filter === 'unread' ? 'WHERE n.readAt IS NULL' : '';

    const [rows] = await pool.query<NotificationRow[]>(
      `
      SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.createdAt,
        n.readAt
      FROM admin_notification n
      ${where}
      ORDER BY n.createdAt DESC
      LIMIT 100
      `
    );

    return NextResponse.json({ notifications: rows });
  } catch (error: any) {
    console.error('Admin notifications error:', error);
    return NextResponse.json(
      { message: 'Failed to load notifications', error: error.message },
      { status: 500 }
    );
  }
}
