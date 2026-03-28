import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const courseId = String(body?.courseId || '').trim();
    const teacherId = String(body?.teacherId || '').trim();

    if (!courseId || !teacherId) {
      return NextResponse.json({ message: 'courseId and teacherId required' }, { status: 400 });
    }

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [courseId, user.id]
    );
    if (enrollRows.length === 0) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `
      SELECT id FROM chat_conversation
      WHERE courseId = ? AND studentId = ? AND teacherId = ?
      LIMIT 1
      `,
      [courseId, user.id, teacherId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ conversationId: existing[0].id });
    }

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const conversationId = idRows[0].id as string;

    await pool.query(
      `
      INSERT INTO chat_conversation
        (id, courseId, studentId, teacherId, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, NOW(), NOW())
      `,
      [conversationId, courseId, user.id, teacherId]
    );

    return NextResponse.json({ conversationId });
  } catch (error: any) {
    console.error('Chat conversation error:', error);
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create conversation', error: error.message },
      { status: 500 }
    );
  }
}
