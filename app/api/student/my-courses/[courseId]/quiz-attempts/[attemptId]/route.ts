import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

interface Params {
  params: Promise<{ courseId: string; attemptId: string }>;
}

function parseOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || ''));
  }
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || ''));
      }
    }
  } catch {
    // ignore parse errors
  }
  return [] as string[];
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();

    const { courseId, attemptId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();
    const normalizedAttemptId = decodeURIComponent(attemptId).trim();

    const [attemptRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        a.id,
        a.totalQuestions,
        a.correctAnswers,
        a.scorePercentage,
        a.submittedAt,
        c.id AS courseId,
        c.title AS courseTitle
      FROM course_quiz_attempt a
      JOIN course c ON c.id = a.courseId
      WHERE a.id = ? AND a.courseId = ? AND a.studentId = ?
      LIMIT 1
      `,
      [normalizedAttemptId, normalizedCourseId, user.id]
    );

    if (attemptRows.length === 0) {
      return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
    }

    const attempt = attemptRows[0];
    const [certRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
      [user.id, normalizedCourseId]
    );
    const certificateId = certRows[0]?.id ? String(certRows[0].id) : null;

    const [answerRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        questionBankId,
        questionType,
        questionText,
        optionsJson,
        selectedOptionIndex,
        selectedTextAnswer,
        correctOptionIndex,
        isCorrect
      FROM course_quiz_attempt_answer
      WHERE attemptId = ?
      ORDER BY createdAt ASC
      `,
      [normalizedAttemptId]
    );

    const answers = answerRows.map((row) => {
      const options = parseOptions(row.optionsJson);
      const selectedIndex =
        row.selectedOptionIndex === null || row.selectedOptionIndex === undefined
          ? null
          : Number(row.selectedOptionIndex);
      const correctIndex = Number(row.correctOptionIndex || 0);
      const questionType = String(row.questionType || 'multiple_choice');
      const selectedTextAnswer = String(row.selectedTextAnswer || '').trim();
      const correctTextAnswer = options[0] || '';

      return {
        id: row.id,
        questionBankId: row.questionBankId,
        questionType,
        questionText: row.questionText,
        options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: correctIndex,
        selectedAnswer:
          questionType === 'written'
            ? selectedTextAnswer
            : selectedIndex !== null
              ? options[selectedIndex] || ''
              : '',
        correctAnswer: questionType === 'written' ? correctTextAnswer : options[correctIndex] || '',
        isCorrect: Boolean(row.isCorrect),
      };
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        courseId: attempt.courseId,
        courseTitle: attempt.courseTitle,
        totalQuestions: Number(attempt.totalQuestions || 0),
        correctAnswers: Number(attempt.correctAnswers || 0),
        scorePercentage: Number(attempt.scorePercentage || 0),
        submittedAt: attempt.submittedAt,
        certificateId,
      },
      answers,
    });
  } catch (error: unknown) {
    console.error('Student quiz attempt GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load quiz attempt',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
