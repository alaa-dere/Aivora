import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin } from '@/lib/request-auth';
import { hasUnifiedNotificationTable } from '@/lib/notifications-unified';

type NotificationRow = RowDataPacket & {
  id: string;
  type: 'student_signup' | 'course_enroll' | 'teacher_message' | 'instructor_application';
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  studentId: string | null;
  courseId: string | null;
  courseTitle: string | null;
  certificateId: string | null;
};

export async function GET(req: Request) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const type = (searchParams.get('type') || 'all').trim();

    const useUnified = await hasUnifiedNotificationTable();
    const whereParts: string[] = [];
    const params: string[] = [];
    if (filter === 'unread') whereParts.push(useUnified ? 'n.readAt IS NULL AND n.deletedAt IS NULL' : 'n.readAt IS NULL');
    if (type && type !== 'all') {
      whereParts.push('n.type = ?');
      params.push(type);
    }
    if (useUnified) whereParts.push("n.recipientRole = 'admin'");
    else whereParts.push('1=1');
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [rows] = await pool.query<NotificationRow[]>(
      `
      SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.createdAt,
        n.readAt,
        ${useUnified ? 'n.relatedUserId' : 'n.studentId'} AS studentId,
        n.courseId,
        c.title AS courseTitle,
        cert.id AS certificateId
      FROM ${useUnified ? 'notification' : 'admin_notification'} n
      LEFT JOIN course c ON c.id = n.courseId
      LEFT JOIN certificate cert
        ON cert.studentId = ${useUnified ? 'n.relatedUserId' : 'n.studentId'}
       AND cert.courseId = n.courseId
      ${where}
      ORDER BY n.createdAt DESC
      LIMIT 100
      `,
      params
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
        studentId: row.studentId || null,
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

export async function PATCH(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const type =
      typeof body?.type === 'string' && body.type.trim() && body.type !== 'all'
        ? body.type.trim()
        : null;

    const useUnified = await hasUnifiedNotificationTable();
    if (type) {
      if (useUnified) {
        await pool.query(
          `UPDATE notification SET readAt = NOW() WHERE recipientRole = 'admin' AND deletedAt IS NULL AND readAt IS NULL AND type = ?`,
          [type]
        );
      } else {
        await pool.query(`UPDATE admin_notification SET readAt = NOW() WHERE readAt IS NULL AND type = ?`, [
          type,
        ]);
      }
    } else {
      if (useUnified) {
        await pool.query(
          `UPDATE notification SET readAt = NOW() WHERE recipientRole = 'admin' AND deletedAt IS NULL AND readAt IS NULL`
        );
      } else {
        await pool.query(`UPDATE admin_notification SET readAt = NOW() WHERE readAt IS NULL`);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin notifications mark-all error:', error);
    return NextResponse.json(
      { message: 'Failed to mark notifications as read', error: error.message },
      { status: 500 }
    );
  }
}
