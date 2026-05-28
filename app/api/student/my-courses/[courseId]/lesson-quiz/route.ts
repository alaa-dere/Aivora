import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { randomUUID } from 'crypto';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';
import { createStudentNotification } from '@/lib/notifications-write';

interface Params {
  params: Promise<{ courseId: string }>;
}

type QuestionRow = RowDataPacket & {
  id: string;
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  optionsJson: unknown;
  correctOptionIndex: number;
};

const CHAPTER_QUIZ_QUESTION_COUNT = 5;

function parseOptions(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item || ''));
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (Array.isArray(parsed)) return parsed.map((item) => String(item || ''));
  } catch {
    // ignore parse errors
  }
  return [] as string[];
}

async function getEnrollment(studentId: string, courseId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, status, progressPercentage
    FROM enrollment
    WHERE studentId = ? AND courseId = ?
    LIMIT 1
    `,
    [studentId, courseId]
  );
  return rows[0] as { id: string; status: string; progressPercentage: number } | undefined;
}

async function assertModuleInCourse(courseId: string, moduleId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT m.id, m.title
    FROM module m
    WHERE m.id = ? AND m.courseId = ?
    LIMIT 1
    `,
    [moduleId, courseId]
  );
  return rows[0] as { id: string; title: string } | undefined;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();
    const { searchParams } = new URL(req.url);
    const mode = String(searchParams.get('mode') || 'overview').trim().toLowerCase();
    const moduleId = String(searchParams.get('moduleId') || '').trim();

    const enrollment = await getEnrollment(user.id, normalizedCourseId);
    if (!enrollment) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    if (!moduleId) {
      return NextResponse.json({ message: 'moduleId is required' }, { status: 400 });
    }

    const moduleRow = await assertModuleInCourse(normalizedCourseId, moduleId);
    if (!moduleRow) {
      return NextResponse.json({ message: 'Chapter not found in this course' }, { status: 404 });
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM course_question_bank
      WHERE courseId = ?
        AND moduleId = ?
      `,
      [normalizedCourseId, moduleId]
    );
    const questionCount = Number(countRows[0]?.total || 0);
    const canStart = questionCount >= CHAPTER_QUIZ_QUESTION_COUNT;

    if (mode === 'start') {
      if (!canStart) {
        return NextResponse.json(
          {
            message: `This chapter needs at least ${CHAPTER_QUIZ_QUESTION_COUNT} questions before quiz can start.`,
          },
          { status: 400 }
        );
      }

      const [questionRows] = await pool.query<QuestionRow[]>(
        `
        SELECT id, questionType, questionText, optionsJson
        FROM course_question_bank
        WHERE courseId = ?
          AND moduleId = ?
        ORDER BY RAND()
        LIMIT ${CHAPTER_QUIZ_QUESTION_COUNT}
        `,
        [normalizedCourseId, moduleId]
      );

      const questions = questionRows.map((row, index) => {
        const options = parseOptions(row.optionsJson);
        const lowerOptions = options.map((option) => option.trim().toLowerCase());
        const looksTrueFalse =
          options.length === 2 &&
          ((lowerOptions[0] === 'true' && lowerOptions[1] === 'false') ||
            (lowerOptions[0] === 'false' && lowerOptions[1] === 'true'));
        const questionType =
          row.questionType ||
          (options.length <= 1 ? 'written' : looksTrueFalse ? 'true_false' : 'multiple_choice');

        return {
          id: row.id,
          order: index + 1,
          questionType,
          questionText: row.questionText,
          options: questionType === 'written' ? [] : options,
        };
      });

      return NextResponse.json({
        module: { id: moduleRow.id, title: moduleRow.title },
        questions,
      });
    }

    const [attemptRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        lesson_quiz_attempt.id AS id,
        lesson_quiz_attempt.totalQuestions AS totalQuestions,
        lesson_quiz_attempt.correctAnswers AS correctAnswers,
        lesson_quiz_attempt.scorePercentage AS scorePercentage,
        lesson_quiz_attempt.submittedAt AS submittedAt
      FROM lesson_quiz_attempt
      JOIN lesson l ON l.id = lesson_quiz_attempt.lessonId
      WHERE lesson_quiz_attempt.courseId = ?
        AND l.moduleId = ?
        AND lesson_quiz_attempt.studentId = ?
      ORDER BY submittedAt DESC
      LIMIT 20
      `,
      [normalizedCourseId, moduleId, user.id]
    );

    const attempts = attemptRows.map((row) => ({
      id: row.id,
      totalQuestions: Number(row.totalQuestions || 0),
      correctAnswers: Number(row.correctAnswers || 0),
      scorePercentage: Number(row.scorePercentage || 0),
      submittedAt: row.submittedAt,
    }));

    return NextResponse.json({
      module: { id: moduleRow.id, title: moduleRow.title },
      questionCount,
      canStart,
      attempts,
    });
  } catch (error: unknown) {
    console.error('Lesson quiz GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load lesson quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();

    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();
    const body = await req.json();
    const moduleId = String(body?.moduleId || '').trim();
    const answersRaw = Array.isArray(body?.answers) ? body.answers : [];

    if (!moduleId) {
      return NextResponse.json({ message: 'moduleId is required' }, { status: 400 });
    }

    const enrollment = await getEnrollment(user.id, normalizedCourseId);
    if (!enrollment) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const moduleRow = await assertModuleInCourse(normalizedCourseId, moduleId);
    if (!moduleRow) {
      return NextResponse.json({ message: 'Chapter not found in this course' }, { status: 404 });
    }

    const [lessonRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM lesson
      WHERE moduleId = ?
      ORDER BY orderNumber ASC
      LIMIT 1
      `,
      [moduleId]
    );
    if (!lessonRows.length) {
      return NextResponse.json({ message: 'This chapter has no lessons yet.' }, { status: 400 });
    }
    const attemptLessonId = String(lessonRows[0].id);
    const questionIdSet = new Set<string>();
    const normalizedAnswers = answersRaw
      .map((item: unknown) => {
        const maybe = (item || {}) as {
          questionId?: string;
          selectedOptionIndex?: number;
          selectedTextAnswer?: string;
        };
        const questionId = String(maybe.questionId || '').trim();
        if (!questionId || questionIdSet.has(questionId)) return null;
        questionIdSet.add(questionId);
        return {
          questionId,
          selectedOptionIndex:
            maybe.selectedOptionIndex === null || maybe.selectedOptionIndex === undefined
              ? null
              : Number(maybe.selectedOptionIndex),
          selectedTextAnswer: String(maybe.selectedTextAnswer || '').trim(),
        };
      })
      .filter(Boolean) as Array<{ questionId: string; selectedOptionIndex: number | null; selectedTextAnswer: string }>;

    if (normalizedAnswers.length !== CHAPTER_QUIZ_QUESTION_COUNT) {
      return NextResponse.json(
        {
          message: `A chapter quiz submission must include exactly ${CHAPTER_QUIZ_QUESTION_COUNT} questions.`,
        },
        { status: 400 }
      );
    }

    const placeholders = normalizedAnswers.map(() => '?').join(',');
    const [questionRows] = await pool.query<QuestionRow[]>(
      `
      SELECT id, questionType, questionText, optionsJson, correctOptionIndex
      FROM course_question_bank
      WHERE courseId = ?
        AND moduleId = ?
        AND id IN (${placeholders})
      `,
      [normalizedCourseId, moduleId, ...normalizedAnswers.map((a) => a.questionId)]
    );

    if (questionRows.length !== normalizedAnswers.length) {
      return NextResponse.json({ message: 'Invalid question set submitted.' }, { status: 400 });
    }

    const answerByQuestionId = new Map(
      normalizedAnswers.map((answer) => [answer.questionId, answer])
    );

    const graded = questionRows.map((question) => {
      const answer = answerByQuestionId.get(String(question.id));
      const options = parseOptions(question.optionsJson);
      const questionType = question.questionType || (options.length <= 1 ? 'written' : 'multiple_choice');

      let isCorrect = false;
      if (questionType === 'written') {
        const expected = String(options[0] || '').trim().toLowerCase();
        const actual = String(answer?.selectedTextAnswer || '').trim().toLowerCase();
        isCorrect = !!actual && actual === expected;
      } else {
        isCorrect = Number(answer?.selectedOptionIndex ?? -1) === Number(question.correctOptionIndex);
      }

      return {
        question,
        answer,
        options,
        questionType,
        isCorrect,
      };
    });

    const totalQuestions = graded.length;
    const correctAnswers = graded.filter((item) => item.isCorrect).length;
    const scorePercentage = Number(((correctAnswers / Math.max(1, totalQuestions)) * 100).toFixed(2));

    const attemptId = randomUUID();
    await pool.query<ResultSetHeader>(
      `
      INSERT INTO lesson_quiz_attempt
        (id, courseId, lessonId, studentId, totalQuestions, correctAnswers, scorePercentage, submittedAt, createdAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [attemptId, normalizedCourseId, attemptLessonId, user.id, totalQuestions, correctAnswers, scorePercentage]
    );

    for (const item of graded) {
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO lesson_quiz_attempt_answer
          (id, attemptId, questionBankId, questionType, questionText, optionsJson, selectedOptionIndex, selectedTextAnswer, correctOptionIndex, isCorrect, createdAt)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          randomUUID(),
          attemptId,
          item.question.id,
          item.questionType,
          item.question.questionText,
          JSON.stringify(item.options),
          item.answer?.selectedOptionIndex,
          item.answer?.selectedTextAnswer || null,
          item.question.correctOptionIndex,
          item.isCorrect,
        ]
      );
    }

    const [historyRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT a.scorePercentage
      FROM lesson_quiz_attempt a
      JOIN lesson l ON l.id = a.lessonId
      WHERE a.courseId = ? AND a.studentId = ? AND l.moduleId = ?
      ORDER BY a.submittedAt DESC
      LIMIT 10
      `,
      [normalizedCourseId, user.id, moduleId]
    );

    const historyScores = historyRows.map((row) => Number(row.scorePercentage || 0));
    const latest = Number(scorePercentage || 0);
    const previousBest = historyScores.slice(1).length ? Math.max(...historyScores.slice(1)) : null;
    const trendText =
      previousBest === null
        ? 'First attempt for this chapter.'
        : latest >= previousBest
          ? `Improved from best previous ${previousBest.toFixed(2)}% to ${latest.toFixed(2)}%.`
          : `Current ${latest.toFixed(2)}%, best previous ${previousBest.toFixed(2)}%.`;

    const weakQuestions = graded
      .filter((item) => !item.isCorrect)
      .slice(0, 2)
      .map((item) => item.question.questionText)
      .join(' | ');
    const strongQuestions = graded
      .filter((item) => item.isCorrect)
      .slice(0, 2)
      .map((item) => item.question.questionText)
      .join(' | ');

    await createStudentNotification({
      studentId: user.id,
      courseId: normalizedCourseId,
      type: scorePercentage >= 60 ? 'quiz_passed' : 'quiz_failed',
      title: `Chapter Quiz: ${moduleRow.title}`,
      message: [
        `Score ${latest.toFixed(2)}% (${correctAnswers}/${totalQuestions}).`,
        trendText,
        strongQuestions ? `Strengths: ${strongQuestions}` : 'Strengths: Keep practicing.',
        weakQuestions ? `Weak points: ${weakQuestions}` : 'Weak points: None in this attempt.',
      ].join(' '),
    });

    return NextResponse.json({
      success: true,
      attemptId,
      moduleId,
      totalQuestions,
      correctAnswers,
      scorePercentage,
      passed: scorePercentage >= 60,
    });
  } catch (error: unknown) {
    console.error('Lesson quiz POST error:', error);
    return NextResponse.json(
      {
        message: 'Failed to submit lesson quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
