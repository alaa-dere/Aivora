import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { randomUUID } from 'crypto';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

interface Params {
  params: Promise<{ courseId: string }>;
}

type QuestionRow = RowDataPacket & {
  id: string;
  questionType: 'multiple_choice' | 'written';
  questionText: string;
  optionsJson: unknown;
  correctOptionIndex: number;
};

const PASSING_SCORE_PERCENTAGE = 60;

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

async function issueCertificateIfEligible(studentId: string, courseId: string) {
  const [existingCertRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
    [studentId, courseId]
  );

  if (existingCertRows.length > 0) {
    return existingCertRows[0].id as string;
  }

  const [courseRows] = await pool.query<RowDataPacket[]>(
    `SELECT title FROM course WHERE id = ? LIMIT 1`,
    [courseId]
  );
  const courseTitle = String(courseRows[0]?.title || 'Course');
  const code =
    courseTitle
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/gi, '').slice(0, 1))
      .join('')
      .toUpperCase()
      .slice(0, 6) || 'AIV';

  const certId = randomUUID();
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const certNo = `AIV-${code}-${dateStamp}-${certId.slice(0, 6).toUpperCase()}`;

  await pool.query<ResultSetHeader>(
    `
    INSERT INTO certificate
      (id, studentId, courseId, certificateNo, issuedAt, createdAt, updatedAt)
    VALUES
      (?, ?, ?, ?, NOW(), NOW(), NOW())
    `,
    [certId, studentId, courseId, certNo]
  );

  return certId;
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

async function getQuestionCount(courseId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM course_question_bank WHERE courseId = ?`,
    [courseId]
  );
  return Number(rows[0]?.total || 0);
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

    const enrollment = await getEnrollment(user.id, normalizedCourseId);
    if (!enrollment) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title FROM course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const questionCount = await getQuestionCount(normalizedCourseId);
    const completed =
      String(enrollment.status || '').toLowerCase() === 'completed' ||
      Number(enrollment.progressPercentage || 0) >= 100;

    const canStart = completed && questionCount >= 10;

    if (mode === 'start') {
      if (!completed) {
        return NextResponse.json(
          { message: 'You need to complete the course before taking this quiz.' },
          { status: 400 }
        );
      }
      if (questionCount < 10) {
        return NextResponse.json(
          { message: 'This course needs at least 10 bank questions before quiz can start.' },
          { status: 400 }
        );
      }

      const [questionRows] = await pool.query<QuestionRow[]>(
        `
        SELECT id, questionType, questionText, optionsJson
        FROM course_question_bank
        WHERE courseId = ?
        ORDER BY RAND()
        LIMIT 10
        `,
        [normalizedCourseId]
      );

      const questions = questionRows.map((row, index) => {
        const options = parseOptions(row.optionsJson);
        const questionType = row.questionType || (options.length <= 1 ? 'written' : 'multiple_choice');

        return {
          id: row.id,
          order: index + 1,
          questionType,
          questionText: row.questionText,
          options: questionType === 'multiple_choice' ? options : [],
        };
      });

      return NextResponse.json({
        course: { id: courseRows[0].id, title: courseRows[0].title },
        questions,
      });
    }

    const [attemptRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, totalQuestions, correctAnswers, scorePercentage, submittedAt
      FROM course_quiz_attempt
      WHERE courseId = ? AND studentId = ?
      ORDER BY submittedAt DESC
      LIMIT 20
      `,
      [normalizedCourseId, user.id]
    );

    const attempts = attemptRows.map((row) => ({
      id: row.id,
      totalQuestions: Number(row.totalQuestions || 0),
      correctAnswers: Number(row.correctAnswers || 0),
      scorePercentage: Number(row.scorePercentage || 0),
      submittedAt: row.submittedAt,
    }));

    return NextResponse.json({
      course: { id: courseRows[0].id, title: courseRows[0].title },
      completed,
      questionCount,
      canStart,
      attempts,
    });
  } catch (error: unknown) {
    console.error('Student course quiz GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load course quiz',
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
    const answersRaw = Array.isArray(body?.answers) ? body.answers : [];

    const enrollment = await getEnrollment(user.id, normalizedCourseId);
    if (!enrollment) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const completed =
      String(enrollment.status || '').toLowerCase() === 'completed' ||
      Number(enrollment.progressPercentage || 0) >= 100;

    if (!completed) {
      return NextResponse.json(
        { message: 'You need to complete the course before taking this quiz.' },
        { status: 400 }
      );
    }

    if (answersRaw.length !== 10) {
      return NextResponse.json(
        { message: 'A quiz submission must include exactly 10 questions.' },
        { status: 400 }
      );
    }

    const questionIdSet = new Set<string>();
    const normalizedAnswers = answersRaw
      .map((item: unknown) => {
        const maybe = (item || {}) as {
          questionId?: string;
          selectedOptionIndex?: number | null;
          textAnswer?: string;
        };
        return {
        questionId: String(maybe.questionId || '').trim(),
        selectedOptionIndex:
          maybe.selectedOptionIndex === null || maybe.selectedOptionIndex === undefined
            ? null
            : Number(maybe.selectedOptionIndex),
        textAnswer: String(maybe.textAnswer || '').trim(),
      };
      })
      .filter((item) => Boolean(item.questionId));

    for (const answer of normalizedAnswers) {
      if (questionIdSet.has(answer.questionId)) {
        return NextResponse.json({ message: 'Duplicate question IDs found.' }, { status: 400 });
      }
      questionIdSet.add(answer.questionId);
    }

    if (questionIdSet.size !== 10) {
      return NextResponse.json({ message: '10 unique question IDs are required.' }, { status: 400 });
    }

    const questionIds = Array.from(questionIdSet);
    const placeholders = questionIds.map(() => '?').join(',');

    const [questionRows] = await pool.query<QuestionRow[]>(
      `
      SELECT id, questionType, questionText, optionsJson, correctOptionIndex
      FROM course_question_bank
      WHERE courseId = ? AND id IN (${placeholders})
      `,
      [normalizedCourseId, ...questionIds]
    );

    if (questionRows.length !== 10) {
      return NextResponse.json(
        { message: 'Some submitted questions are invalid for this course.' },
        { status: 400 }
      );
    }

    const questionById = new Map(questionRows.map((row) => [row.id, row]));
    const answerById = new Map(normalizedAnswers.map((item) => [item.questionId, item]));

    let correctAnswers = 0;
    const gradedAnswers = questionIds.map((questionId) => {
      const question = questionById.get(questionId)!;
      const answer = answerById.get(questionId);
      const options = parseOptions(question.optionsJson);
      const questionType =
        question.questionType || (options.length <= 1 ? 'written' : 'multiple_choice');
      const selectedOptionIndex =
        answer && Number.isInteger(answer.selectedOptionIndex)
          ? Number(answer.selectedOptionIndex)
          : null;
      const selectedTextAnswer = answer?.textAnswer ? String(answer.textAnswer).trim() : '';
      let isCorrect = false;

      if (questionType === 'written') {
        const expected = String(options[0] || '').trim().toLowerCase();
        const provided = selectedTextAnswer.toLowerCase();
        isCorrect = Boolean(expected) && Boolean(provided) && provided === expected;
      } else {
        isCorrect =
          selectedOptionIndex !== null && selectedOptionIndex === Number(question.correctOptionIndex);
      }
      if (isCorrect) {
        correctAnswers += 1;
      }

      return {
        question,
        questionType,
        optionsJson: JSON.stringify(options),
        selectedOptionIndex,
        selectedTextAnswer,
        isCorrect,
      };
    });

    const totalQuestions = gradedAnswers.length;
    const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const attemptId = randomUUID();
    await pool.query<ResultSetHeader>(
      `
      INSERT INTO course_quiz_attempt
        (id, courseId, studentId, totalQuestions, correctAnswers, scorePercentage, submittedAt, createdAt)
      VALUES
        (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        attemptId,
        normalizedCourseId,
        user.id,
        totalQuestions,
        correctAnswers,
        Number(scorePercentage.toFixed(2)),
      ]
    );

    for (const graded of gradedAnswers) {
      const answerId = randomUUID();
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO course_quiz_attempt_answer
          (id, attemptId, questionBankId, questionType, questionText, optionsJson, selectedOptionIndex, selectedTextAnswer, correctOptionIndex, isCorrect, createdAt)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          answerId,
          attemptId,
          graded.question.id,
          graded.questionType,
          graded.question.questionText,
          graded.optionsJson,
          graded.selectedOptionIndex,
          graded.questionType === 'written' ? graded.selectedTextAnswer : null,
          Number(graded.question.correctOptionIndex),
          graded.isCorrect,
        ]
      );
    }

    let certificateIssued = false;
    let certificateId: string | null = null;
    if (Number(scorePercentage.toFixed(2)) >= PASSING_SCORE_PERCENTAGE) {
      certificateId = await issueCertificateIfEligible(user.id, normalizedCourseId);
      certificateIssued = Boolean(certificateId);
    }

    return NextResponse.json({
      success: true,
      attemptId,
      totalQuestions,
      correctAnswers,
      scorePercentage: Number(scorePercentage.toFixed(2)),
      passed: Number(scorePercentage.toFixed(2)) >= PASSING_SCORE_PERCENTAGE,
      passingScorePercentage: PASSING_SCORE_PERCENTAGE,
      certificateIssued,
      certificateId,
    });
  } catch (error: unknown) {
    console.error('Student course quiz POST error:', error);
    return NextResponse.json(
      {
        message: 'Failed to submit quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
