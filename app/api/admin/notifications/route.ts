import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestRole } from '@/lib/request-auth';

type NotificationRow = RowDataPacket & {
  id: string;
  type: 'student_signup' | 'course_enroll' | 'teacher_message';
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  courseId: string | null;
  courseTitle: string | null;
  certificateId: string | null;
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
        n.readAt,
        n.courseId,
        c.title AS courseTitle,
        cert.id AS certificateId
      FROM admin_notification n
      LEFT JOIN course c ON c.id = n.courseId
      LEFT JOIN certificate cert
        ON cert.studentId = n.studentId
       AND cert.courseId = n.courseId
      ${where}
      ORDER BY n.createdAt DESC
      LIMIT 100
      `
    );

    const notifications = rows.map((row) => {
      let message = row.message;
      if (row.courseId && row.courseTitle) {
        message = message.replace(
          `course ${row.courseId}`,
          `course ${row.courseTitle}`
        );
      }
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        message,
        createdAt: row.createdAt,
        readAt: row.readAt,
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        certificateId: row.certificateId || null,
      };
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Admin notifications error:', error);
    return NextResponse.json(
      { message: 'Failed to load notifications', error: error.message },
      { status: 500 }
    );
  }
}
