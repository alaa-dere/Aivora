import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin } from '@/lib/request-auth';

type AdminLiveSessionRow = RowDataPacket & {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'completed';
  meetingLink: string | null;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseTitle: string;
  totalStudents: number;
};

export async function GET(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const from = String(searchParams.get('from') || '').trim();
    const to = String(searchParams.get('to') || '').trim();

    const where: string[] = [];
    const params: string[] = [];
    if (from) {
      where.push('s.startAt >= ?');
      params.push(`${from} 00:00:00`);
    }
    if (to) {
      where.push('s.startAt <= ?');
      params.push(`${to} 23:59:59`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query<AdminLiveSessionRow[]>(
      `
      SELECT
        s.id,
        s.title,
        s.startAt,
        s.endAt,
        s.status,
        s.meetingLink,
        s.teacherId,
        t.fullName AS teacherName,
        s.courseId,
        c.title AS courseTitle,
        (
          SELECT COUNT(*)
          FROM live_session_attendance a
          WHERE a.sessionId = s.id
        ) AS totalStudents
      FROM live_session s
      JOIN course c ON c.id = s.courseId
      JOIN user t ON t.id = s.teacherId
      ${whereSql}
      ORDER BY s.startAt ASC
      LIMIT 500
      `,
      params
    );

    return NextResponse.json({
      sessions: rows.map((row) => ({
        id: row.id,
        title: row.title,
        startAt: row.startAt,
        endAt: row.endAt,
        status: row.status,
        meetingLink: row.meetingLink,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        totalStudents: Number(row.totalStudents || 0),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin live sessions GET error:', error);
    return NextResponse.json({ message: 'Failed to load live sessions', error: message }, { status: 500 });
  }
}

