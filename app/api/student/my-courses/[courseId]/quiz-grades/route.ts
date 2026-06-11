import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();

    const [enrollmentRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [normalizedCourseId, user.id]
    );
    if (!enrollmentRows.length) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title FROM course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );
    if (!courseRows.length) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const [chapterAttempts] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        a.id,
        m.id AS moduleId,
        m.title AS moduleTitle,
        a.totalQuestions,
        a.correctAnswers,
        a.scorePercentage,
        a.submittedAt
      FROM lesson_quiz_attempt a
      JOIN lesson l ON l.id = a.lessonId
      JOIN module m ON m.id = l.moduleId
      WHERE a.courseId = ? AND a.studentId = ?
      ORDER BY a.submittedAt DESC
      `,
      [normalizedCourseId, user.id]
    );

    const [finalAttempts] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, totalQuestions, correctAnswers, scorePercentage, submittedAt
      FROM course_quiz_attempt
      WHERE courseId = ? AND studentId = ?
      ORDER BY submittedAt DESC
      `,
      [normalizedCourseId, user.id]
    );

    return NextResponse.json({
      course: {
        id: String(courseRows[0].id),
        title: String(courseRows[0].title || 'Course'),
      },
      chapterAttempts: chapterAttempts.map((row) => ({
        id: String(row.id),
        moduleId: String(row.moduleId),
        moduleTitle: String(row.moduleTitle || 'Chapter'),
        totalQuestions: Number(row.totalQuestions || 0),
        correctAnswers: Number(row.correctAnswers || 0),
        scorePercentage: Number(row.scorePercentage || 0),
        submittedAt: row.submittedAt,
      })),
      finalAttempts: finalAttempts.map((row) => ({
        id: String(row.id),
        totalQuestions: Number(row.totalQuestions || 0),
        correctAnswers: Number(row.correctAnswers || 0),
        scorePercentage: Number(row.scorePercentage || 0),
        submittedAt: row.submittedAt,
      })),
    });
  } catch (error: unknown) {
    console.error('Quiz grades GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load quiz grades',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

