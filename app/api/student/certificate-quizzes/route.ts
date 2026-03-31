import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

type QuizRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  questionCount: number;
  bestScore: number;
};

const PASSING_SCORE_PERCENTAGE = 60;

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();

    const [rows] = await pool.query<QuizRow[]>(
      `
      SELECT
        c.id AS courseId,
        c.title AS courseTitle,
        COUNT(DISTINCT qb.id) AS questionCount,
        COALESCE(MAX(qa.scorePercentage), 0) AS bestScore
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      LEFT JOIN certificate cert
        ON cert.courseId = e.courseId AND cert.studentId = e.studentId
      JOIN course_question_bank qb ON qb.courseId = c.id
      LEFT JOIN course_quiz_attempt qa
        ON qa.courseId = c.id AND qa.studentId = e.studentId
      WHERE e.studentId = ?
        AND (e.status = 'completed' OR e.progressPercentage >= 100)
        AND cert.id IS NULL
      GROUP BY c.id, c.title
      HAVING COUNT(DISTINCT qb.id) >= 10
         AND COALESCE(MAX(qa.scorePercentage), 0) < ?
      ORDER BY c.title ASC
      `,
      [user.id, PASSING_SCORE_PERCENTAGE]
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
        id: `${row.courseId}-final`,
        title: `Final Course Quiz (pass at least ${PASSING_SCORE_PERCENTAGE}% from ${Number(row.questionCount || 0)} bank items)`,
      });
    }

    return NextResponse.json({
      courses: Object.values(grouped),
    });
  } catch (error: unknown) {
    console.error('Certificate quizzes error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load certificate quizzes',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
