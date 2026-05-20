import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const courseId = String(body?.courseId || '').trim();
    const teacherId = String(body?.teacherId || '').trim();
    const studentId = String(body?.studentId || '').trim();

    if (!courseId) {
      return NextResponse.json({ message: 'courseId required' }, { status: 400 });
    }

    let resolvedTeacherId = '';
    let resolvedStudentId = '';

    if (user.role === 'student') {
      resolvedTeacherId = teacherId;
      resolvedStudentId = user.id;
      if (!resolvedTeacherId) {
        return NextResponse.json({ message: 'teacherId required' }, { status: 400 });
      }
    } else {
      resolvedTeacherId = user.id;
      resolvedStudentId = studentId;
      if (!resolvedStudentId) {
        return NextResponse.json({ message: 'studentId required' }, { status: 400 });
      }
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, teacherId FROM course WHERE id = ? LIMIT 1`,
      [courseId]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    const course = courseRows[0] as { id: string; teacherId: string };
    if (course.teacherId !== resolvedTeacherId) {
      return NextResponse.json({ message: 'Teacher does not match course' }, { status: 403 });
    }

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [courseId, resolvedStudentId]
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
      [courseId, resolvedStudentId, resolvedTeacherId]
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
      [conversationId, courseId, resolvedStudentId, resolvedTeacherId]
    );

    return NextResponse.json({ conversationId });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Chat conversation error:', error);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create conversation', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
