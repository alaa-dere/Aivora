import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { randomUUID } from 'crypto';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';
import { ensurePathQuizSchema } from '@/lib/ensure-path-quiz-schema';
import { createStudentNotification } from '@/lib/notifications-write';

interface Params {
  params: Promise<{ pathId: string }>;
}

type QuestionRow = RowDataPacket & {
  id: string;
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  optionsJson: unknown;
  correctOptionIndex: number;
};

type NormalizedAnswer = {
  questionId: string;
  selectedOptionIndex: number | null;
  textAnswer: string;
};

const TOTAL_QUESTIONS = 15;
const PASSING_SCORE_PERCENTAGE = 60;

function parseOptions(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item || ''));
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item || ''));
    }
  } catch {
    // ignore
  }
  return [] as string[];
}

async function getPathAndEligibility(studentId: string, pathId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      lp.id,
      lp.title,
      pe.status AS pathStatus,
      pe.progressPercentage
    FROM learning_path lp
    JOIN path_enrollment pe ON pe.pathId = lp.id
    WHERE lp.id = ?
      AND pe.studentId = ?
    LIMIT 1
    `,
    [pathId, studentId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  const status = String(row.pathStatus || '').toLowerCase();
  const progress = Number(row.progressPercentage || 0);
  const completed = status === 'completed' || progress >= 100;

  return {
    id: String(row.id),
    title: String(row.title || 'Learning Path'),
    completed,
  };
}

async function issuePathCertificate(studentId: string, pathId: string, pathTitle: string) {
  const [existingRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM path_certificate WHERE studentId = ? AND pathId = ? LIMIT 1`,
    [studentId, pathId]
  );
  if (existingRows.length > 0) {
    return { certificateId: String(existingRows[0].id), newlyIssued: false };
  }

  const code =
    pathTitle
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/gi, '').slice(0, 1))
      .join('')
      .toUpperCase()
      .slice(0, 6) || 'AIVP';
  const certId = randomUUID();
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const certNo = `AIVP-${code}-${dateStamp}-${certId.slice(0, 6).toUpperCase()}`;

  await pool.query<ResultSetHeader>(
    `
    INSERT INTO path_certificate
      (id, pathId, studentId, certificateNo, issuedAt, createdAt, updatedAt)
    VALUES
      (?, ?, ?, ?, NOW(), NOW(), NOW())
    `,
    [certId, pathId, studentId, certNo]
  );

  return { certificateId: certId, newlyIssued: true };
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();
    await ensurePathQuizSchema();

    const { pathId } = await params;
    const id = decodeURIComponent(pathId).trim();
    const eligibility = await getPathAndEligibility(user.id, id);
    if (!eligibility) {
      return NextResponse.json({ message: 'Path enrollment required' }, { status: 403 });
    }

    const [questionCountRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM course_question_bank qb
      JOIN learning_path_course lpc ON lpc.courseId = qb.courseId
      WHERE lpc.pathId = ?
      `,
      [id]
    );
    const questionCount = Number(questionCountRows[0]?.total || 0);
    const canStart = eligibility.completed && questionCount >= TOTAL_QUESTIONS;
    const [pathCertRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM path_certificate WHERE pathId = ? AND studentId = ? LIMIT 1`,
      [id, user.id]
    );
    const certificateId = pathCertRows[0]?.id ? String(pathCertRows[0].id) : null;

    const { searchParams } = new URL(req.url);
    const mode = String(searchParams.get('mode') || 'overview').trim().toLowerCase();

    if (mode === 'start') {
      if (certificateId) {
        return NextResponse.json(
          { message: 'Path certificate already earned for this path.' },
          { status: 400 }
        );
      }
      if (!eligibility.completed) {
        return NextResponse.json(
          { message: 'Complete all courses in this path before taking the final path quiz.' },
          { status: 400 }
        );
      }
      if (questionCount < TOTAL_QUESTIONS) {
        return NextResponse.json(
          { message: `This path needs at least ${TOTAL_QUESTIONS} bank questions across its courses.` },
          { status: 400 }
        );
      }

      const [questionRows] = await pool.query<QuestionRow[]>(
        `
        SELECT qb.id, qb.questionType, qb.questionText, qb.optionsJson
        FROM course_question_bank qb
        JOIN learning_path_course lpc ON lpc.courseId = qb.courseId
        WHERE lpc.pathId = ?
        ORDER BY RAND()
        LIMIT ?
        `,
        [id, TOTAL_QUESTIONS]
      );

      const questions = questionRows.map((row, index) => {
        const options = parseOptions(row.optionsJson);
        const lower = options.map((option) => option.trim().toLowerCase());
        const looksTrueFalse =
          options.length === 2 &&
          ((lower[0] === 'true' && lower[1] === 'false') ||
            (lower[0] === 'false' && lower[1] === 'true'));
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
        path: { id: eligibility.id, title: eligibility.title },
        questions,
        passingScorePercentage: PASSING_SCORE_PERCENTAGE,
      });
    }

    const [attemptRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, totalQuestions, correctAnswers, scorePercentage, submittedAt
      FROM path_quiz_attempt
      WHERE pathId = ? AND studentId = ?
      ORDER BY submittedAt DESC
      LIMIT 20
      `,
      [id, user.id]
    );

    const attempts = attemptRows.map((row) => ({
      id: String(row.id),
      totalQuestions: Number(row.totalQuestions || 0),
      correctAnswers: Number(row.correctAnswers || 0),
      scorePercentage: Number(row.scorePercentage || 0),
      submittedAt: row.submittedAt,
    }));

    return NextResponse.json({
      path: { id: eligibility.id, title: eligibility.title },
      completed: eligibility.completed,
      questionCount,
      canStart,
      attempts,
      certificateId,
      totalQuestionsRequired: TOTAL_QUESTIONS,
      passingScorePercentage: PASSING_SCORE_PERCENTAGE,
    });
  } catch (error: unknown) {
    console.error('Student path quiz GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load path quiz',
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
    await ensurePathQuizSchema();

    const { pathId } = await params;
    const id = decodeURIComponent(pathId).trim();
    const eligibility = await getPathAndEligibility(user.id, id);
    if (!eligibility) {
      return NextResponse.json({ message: 'Path enrollment required' }, { status: 403 });
    }
    if (!eligibility.completed) {
      return NextResponse.json(
        { message: 'Complete all path courses before submitting the final path quiz.' },
        { status: 400 }
      );
    }
    const [pathCertRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM path_certificate WHERE studentId = ? AND pathId = ? LIMIT 1`,
      [user.id, id]
    );
    if (pathCertRows.length > 0) {
      return NextResponse.json(
        { message: 'Path certificate already earned for this path.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const answersRaw = Array.isArray(body?.answers) ? body.answers : [];
    if (answersRaw.length !== TOTAL_QUESTIONS) {
      return NextResponse.json(
        { message: `Submission must include exactly ${TOTAL_QUESTIONS} questions.` },
        { status: 400 }
      );
    }

    const normalizedAnswers: NormalizedAnswer[] = answersRaw
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
      .filter((item: NormalizedAnswer) => Boolean(item.questionId));

    const questionIdSet = new Set<string>();
    for (const answer of normalizedAnswers) {
      if (questionIdSet.has(answer.questionId)) {
        return NextResponse.json({ message: 'Duplicate question IDs found.' }, { status: 400 });
      }
      questionIdSet.add(answer.questionId);
    }
    if (questionIdSet.size !== TOTAL_QUESTIONS) {
      return NextResponse.json(
        { message: `${TOTAL_QUESTIONS} unique question IDs are required.` },
        { status: 400 }
      );
    }

    const questionIds = Array.from(questionIdSet);
    const placeholders = questionIds.map(() => '?').join(',');

    const [questionRows] = await pool.query<QuestionRow[]>(
      `
      SELECT qb.id, qb.questionType, qb.questionText, qb.optionsJson, qb.correctOptionIndex
      FROM course_question_bank qb
      JOIN learning_path_course lpc ON lpc.courseId = qb.courseId
      WHERE lpc.pathId = ? AND qb.id IN (${placeholders})
      `,
      [id, ...questionIds]
    );
    if (questionRows.length !== TOTAL_QUESTIONS) {
      return NextResponse.json(
        { message: 'Some submitted questions are invalid for this path.' },
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
      const lower = options.map((option) => option.trim().toLowerCase());
      const looksTrueFalse =
        options.length === 2 &&
        ((lower[0] === 'true' && lower[1] === 'false') ||
          (lower[0] === 'false' && lower[1] === 'true'));
      const questionType =
        question.questionType ||
        (options.length <= 1 ? 'written' : looksTrueFalse ? 'true_false' : 'multiple_choice');

      const selectedOptionIndex =
        answer && Number.isInteger(answer.selectedOptionIndex)
          ? Number(answer.selectedOptionIndex)
          : null;
      const selectedTextAnswer = answer?.textAnswer ? String(answer.textAnswer).trim() : '';

      let isCorrect = false;
      if (questionType === 'written') {
        const expected = String(options[0] || '').trim().toLowerCase();
        const provided = selectedTextAnswer.toLowerCase();
        isCorrect = Boolean(expected) && Boolean(provided) && expected === provided;
      } else {
        isCorrect =
          selectedOptionIndex !== null && selectedOptionIndex === Number(question.correctOptionIndex);
      }
      if (isCorrect) correctAnswers += 1;

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
    const roundedScore = Number(scorePercentage.toFixed(2));

    const attemptId = randomUUID();
    await pool.query<ResultSetHeader>(
      `
      INSERT INTO path_quiz_attempt
        (id, pathId, studentId, totalQuestions, correctAnswers, scorePercentage, submittedAt, createdAt)
      VALUES
        (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [attemptId, id, user.id, totalQuestions, correctAnswers, roundedScore]
    );

    for (const graded of gradedAnswers) {
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO path_quiz_attempt_answer
          (id, attemptId, questionBankId, questionType, questionText, optionsJson, selectedOptionIndex, selectedTextAnswer, correctOptionIndex, isCorrect, createdAt)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          randomUUID(),
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
    if (roundedScore >= PASSING_SCORE_PERCENTAGE) {
      const certResult = await issuePathCertificate(user.id, id, eligibility.title);
      certificateIssued = certResult.newlyIssued;
      certificateId = certResult.certificateId;

      if (certResult.newlyIssued) {
        await createStudentNotification({
          studentId: user.id,
          type: 'certificate_earned',
          title: 'Path certificate earned',
          message: `You passed the final quiz for "${eligibility.title}" and unlocked your path certificate.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      attemptId,
      totalQuestions,
      correctAnswers,
      scorePercentage: roundedScore,
      passed: roundedScore >= PASSING_SCORE_PERCENTAGE,
      passingScorePercentage: PASSING_SCORE_PERCENTAGE,
      certificateIssued,
      certificateId,
    });
  } catch (error: unknown) {
    console.error('Student path quiz POST error:', error);
    return NextResponse.json(
      {
        message: 'Failed to submit path quiz',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
