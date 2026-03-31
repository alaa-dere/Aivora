import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

interface Params {
  params: Promise<{ questionId: string }>;
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();

    const { questionId } = await params;
    const id = decodeURIComponent(questionId).trim();

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT qb.id
      FROM course_question_bank qb
      JOIN course c ON c.id = qb.courseId
      WHERE qb.id = ? AND c.teacherId = ?
      LIMIT 1
      `,
      [id, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    await pool.query<ResultSetHeader>(`DELETE FROM course_question_bank WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Teacher question bank DELETE error:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete question',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
