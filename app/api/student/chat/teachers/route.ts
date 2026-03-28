import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type TeacherRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  conversationId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<TeacherRow[]>(
      `
      SELECT
        c.id AS courseId,
        c.title AS courseTitle,
        t.id AS teacherId,
        t.fullName AS teacherName,
        t.email AS teacherEmail,
        conv.id AS conversationId,
        lm.body AS lastMessage,
        lm.createdAt AS lastMessageAt
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user t ON t.id = c.teacherId
      LEFT JOIN chat_conversation conv
        ON conv.courseId = c.id
       AND conv.studentId = e.studentId
       AND conv.teacherId = t.id
      LEFT JOIN (
        SELECT m.conversationId, m.body, m.createdAt
        FROM chat_message m
        JOIN (
          SELECT conversationId, MAX(createdAt) AS maxCreated
          FROM chat_message
          GROUP BY conversationId
        ) x
          ON x.conversationId = m.conversationId AND x.maxCreated = m.createdAt
      ) lm
        ON lm.conversationId = conv.id
      WHERE e.studentId = ?
      ORDER BY c.title ASC
      `,
      [user.id]
    );

    return NextResponse.json({
      teachers: rows.map((row) => ({
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        teacherEmail: row.teacherEmail,
        conversationId: row.conversationId,
        lastMessage: row.lastMessage,
        lastMessageAt: row.lastMessageAt,
      })),
    });
  } catch (error: any) {
    console.error('Student chat teachers error:', error);
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ teachers: [], needsMigration: true });
    }
    return NextResponse.json(
      { message: 'Failed to load teachers', error: error.message },
      { status: 500 }
    );
  }
}
