import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type QuizRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  quizId: string;
  quizTitle: string;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<QuizRow[]>(
      `
      SELECT
        c.id AS courseId,
        c.title AS courseTitle,
        l.id AS quizId,
        l.title AS quizTitle
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      LEFT JOIN certificate cert
        ON cert.courseId = e.courseId AND cert.studentId = e.studentId
      JOIN module m ON m.courseId = c.id
      JOIN lesson l
        ON l.moduleId = m.id AND l.type = 'quiz' AND l.isPublished = TRUE
      WHERE e.studentId = ?
        AND (e.status = 'completed' OR e.progressPercentage >= 100)
        AND cert.id IS NULL
      ORDER BY c.title ASC, m.orderNumber ASC, l.orderNumber ASC
      `,
      [user.id]
    );

    const grouped: Record<
      string,
      { courseId: string; courseTitle: string; quizzes: { id: string; title: string }[] }
    > = {};

    for (const row of rows) {
      if (!grouped[row.courseId]) {
        grouped[row.courseId] = {
          courseId: row.courseId,
          courseTitle: row.courseTitle,
          quizzes: [],
        };
      }
      grouped[row.courseId].quizzes.push({
        id: row.quizId,
        title: row.quizTitle,
      });
    }

    return NextResponse.json({
      courses: Object.values(grouped),
    });
  } catch (error: any) {
    console.error('Certificate quizzes error:', error);
    return NextResponse.json(
      { message: 'Failed to load certificate quizzes', error: error.message },
      { status: 500 }
    );
  }
}
