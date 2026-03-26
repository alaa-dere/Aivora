import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();
    const body = await req.json();
    const lessonId = String(body?.lessonId || '').trim();

    if (!lessonId) {
      return NextResponse.json({ message: 'Lesson ID required' }, { status: 400 });
    }

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [id, user.id]
    );
    if (enrollRows.length === 0) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }
    const enrollmentId = enrollRows[0].id as string;

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM lessonprogress WHERE enrollmentId = ? AND lessonId = ? LIMIT 1`,
      [enrollmentId, lessonId]
    );

    if (existing.length === 0) {
      const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const progressId = idRows[0].id as string;
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO lessonprogress
          (id, enrollmentId, lessonId, completed, progressPercentage, startedAt, completedAt)
        VALUES
          (?, ?, ?, TRUE, 100, NOW(), NOW())
        `,
        [progressId, enrollmentId, lessonId]
      );
    } else {
      await pool.query<ResultSetHeader>(
        `
        UPDATE lessonprogress
        SET completed = TRUE, progressPercentage = 100, completedAt = NOW()
        WHERE id = ?
        `,
        [existing[0].id]
      );
    }

    const [totalRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS totalLessons
      FROM lesson l
      JOIN module m ON m.id = l.moduleId
      WHERE m.courseId = ?
      `,
      [id]
    );
    const totalLessons = Number(totalRows[0]?.totalLessons || 0);

    const [completedRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS completedLessons
      FROM lessonprogress lp
      JOIN lesson l ON l.id = lp.lessonId
      JOIN module m ON m.id = l.moduleId
      WHERE m.courseId = ? AND lp.enrollmentId = ? AND lp.completed = TRUE
      `,
      [id, enrollmentId]
    );
    const completedLessons = Number(completedRows[0]?.completedLessons || 0);
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    await pool.query<ResultSetHeader>(
      `
      UPDATE enrollment
      SET progressPercentage = ?, status = IF(?, 'completed', status)
      WHERE id = ?
      `,
      [progressPercentage, completedLessons === totalLessons && totalLessons > 0, enrollmentId]
    );

    return NextResponse.json({
      success: true,
      progressPercentage,
      completedLessons,
      totalLessons,
    });
  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { message: 'Failed to update progress', error: error.message },
      { status: 500 }
    );
  }
}
