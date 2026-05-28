import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { randomUUID } from 'crypto';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';
import {
  createStudentNotification,
  createAdminNotification,
  createTeacherNotification,
} from '@/lib/notifications-write';

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

const PASSING_SCORE_PERCENTAGE = 60;
const COURSE_QUIZ_QUESTION_COUNT = 10;

async function ensureTeacherNotificationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teacher_notification (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      teacherId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      studentId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
      type VARCHAR(64) NOT NULL COLLATE utf8mb4_unicode_ci DEFAULT 'quiz_result',
      title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
      message TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      readAt DATETIME NULL,
      INDEX idx_teacher_notif_teacher (teacherId),
      INDEX idx_teacher_notif_created (createdAt),
      INDEX idx_teacher_notif_read (readAt),
      FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);
}

async function ensureStudentNotificationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_notification (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
      type ENUM('live_session', 'missed_session', 'course_failed', 'quiz_passed', 'quiz_failed', 'certificate_earned') DEFAULT 'live_session',
      title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
      message TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      readAt DATETIME NULL,
      INDEX idx_student_notif_student (studentId),
      INDEX idx_student_notif_course (courseId),
      INDEX idx_student_notif_type (type),
      INDEX idx_student_notif_read (readAt),
      FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    ALTER TABLE student_notification
    MODIFY COLUMN type ENUM('live_session', 'missed_session', 'course_failed', 'quiz_passed', 'quiz_failed', 'certificate_earned')
    DEFAULT 'live_session'
  `);
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

async function issueCertificateIfEligible(studentId: string, courseId: string) {
  const [existingCertRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
    [studentId, courseId]
  );

  if (existingCertRows.length > 0) {
    return {
      certificateId: existingCertRows[0].id as string,
      newlyIssued: false,
    };
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

  return { certificateId: certId, newlyIssued: true };
}

async function createQuizNotifications(input: {
  teacherId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  scorePercentage: number;
  passed: boolean;
  attemptNumber: number;
  issuedCertificateNow: boolean;
  issuedCertificateOnRetake: boolean;
}) {
  const baseTitle = input.passed ? 'Quiz passed' : 'Quiz failed';
  const baseMessage = `${input.studentName} ${
    input.passed ? 'passed' : 'failed'
  } the quiz for ${input.courseTitle} with ${input.scorePercentage.toFixed(2)}% (attempt #${input.attemptNumber}).`;

  await createTeacherNotification({
    teacherId: input.teacherId,
    studentId: input.studentId,
    courseId: input.courseId,
    type: 'quiz_result',
    title: baseTitle,
    message: baseMessage,
  });

  if (input.issuedCertificateNow) {
    const certTitle = input.issuedCertificateOnRetake
      ? 'Certificate unlocked after retake'
      : 'Certificate unlocked';
    const certMessage = input.issuedCertificateOnRetake
      ? `${input.studentName} retook the quiz and unlocked the certificate for ${input.courseTitle}.`
      : `${input.studentName} unlocked the certificate for ${input.courseTitle}.`;

    await createTeacherNotification({
      teacherId: input.teacherId,
      studentId: input.studentId,
      courseId: input.courseId,
      type: 'quiz_certificate',
      title: certTitle,
      message: certMessage,
    });

    await createStudentNotification({
      studentId: input.studentId,
      teacherId: input.teacherId,
      courseId: input.courseId,
      type: 'certificate_earned',
      title: certTitle,
      message: certMessage,
    });
  }
}

async function enrollStudentInNextPathCourses(input: {
  studentId: string;
  studentName: string;
  completedCourseId: string;
  completedCourseTitle: string;
}) {
  const [pathRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      pe.pathId,
      lp.title AS pathTitle,
      lpc.orderNumber
    FROM path_enrollment pe
    JOIN learning_path lp ON lp.id = pe.pathId
    JOIN learning_path_course lpc
      ON lpc.pathId = pe.pathId
     AND lpc.courseId = ?
    WHERE pe.studentId = ?
      AND pe.status IN ('enrolled', 'in_progress')
      AND lp.status = 'published'
    `,
    [input.completedCourseId, input.studentId]
  );

  for (const row of pathRows) {
    const pathId = String(row.pathId || '').trim();
    const pathTitle = String(row.pathTitle || 'Learning Path');
    const currentOrder = Number(row.orderNumber || 0);
    if (!pathId || !currentOrder) continue;

    const [nextRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT lpc.courseId, c.title AS courseTitle, c.teacherId
      FROM learning_path_course lpc
      JOIN course c ON c.id = lpc.courseId
      WHERE lpc.pathId = ?
        AND lpc.orderNumber > ?
        AND c.status = 'published'
      ORDER BY lpc.orderNumber ASC
      LIMIT 1
      `,
      [pathId, currentOrder]
    );

    if (nextRows.length === 0) {
      await pool.query<ResultSetHeader>(
        `
        UPDATE path_enrollment
        SET status = 'completed', progressPercentage = 100, completedAt = NOW()
        WHERE pathId = ? AND studentId = ?
        `,
        [pathId, input.studentId]
      );
      continue;
    }

    const nextCourseId = String(nextRows[0].courseId || '').trim();
    const nextCourseTitle = String(nextRows[0].courseTitle || 'Course');
    const nextTeacherId = String(nextRows[0].teacherId || '').trim();
    if (!nextCourseId) continue;

    await pool.query<ResultSetHeader>(
      `
      INSERT IGNORE INTO enrollment
        (id, studentId, courseId, enrolledAt, status, progressPercentage)
      VALUES
        (UUID(), ?, ?, NOW(), 'enrolled', 0)
      `,
      [input.studentId, nextCourseId]
    );

    await createAdminNotification({
      type: 'course_enroll',
      title: 'Path Progress: Next Course Enrollment',
      message: `${input.studentName} completed "${input.completedCourseTitle}" in path "${pathTitle}" and was auto-enrolled in "${nextCourseTitle}".`,
      studentId: input.studentId,
      courseId: nextCourseId,
    });

    if (nextTeacherId) {
      await createTeacherNotification({
        teacherId: nextTeacherId,
        studentId: input.studentId,
        courseId: nextCourseId,
        type: 'course_enroll',
        title: 'New Path Student Enrollment',
        message: `${input.studentName} was auto-enrolled in your course "${nextCourseTitle}" through path "${pathTitle}".`,
      });
    }
  }
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
    `
    SELECT COUNT(*) AS total
    FROM course_question_bank
    WHERE courseId = ?
      AND moduleId IS NULL
    `,
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
    await ensureTeacherNotificationTable();
    await ensureStudentNotificationTable();

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

    const canStart = completed && questionCount >= COURSE_QUIZ_QUESTION_COUNT;

    if (mode === 'start') {
      if (!completed) {
        return NextResponse.json(
          { message: 'You need to complete the course before taking this quiz.' },
          { status: 400 }
        );
      }
      if (questionCount < COURSE_QUIZ_QUESTION_COUNT) {
        return NextResponse.json(
          {
            message: `This course needs at least ${COURSE_QUIZ_QUESTION_COUNT} final-course questions before quiz can start.`,
          },
          { status: 400 }
        );
      }

      const [questionRows] = await pool.query<QuestionRow[]>(
        `
        SELECT id, questionType, questionText, optionsJson
        FROM course_question_bank
        WHERE courseId = ?
          AND moduleId IS NULL
        ORDER BY RAND()
        LIMIT ${COURSE_QUIZ_QUESTION_COUNT}
        `,
        [normalizedCourseId]
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
          (options.length <= 1
            ? 'written'
            : looksTrueFalse
              ? 'true_false'
              : 'multiple_choice');

        return {
          id: row.id,
          order: index + 1,
          questionType,
          questionText: row.questionText,
          options: questionType === 'written' ? [] : options,
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
    await ensureTeacherNotificationTable();
    await ensureStudentNotificationTable();
    await ensureTeacherNotificationTable();

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

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, teacherId FROM course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    const course = {
      id: String(courseRows[0].id),
      title: String(courseRows[0].title || 'Course'),
      teacherId: String(courseRows[0].teacherId || ''),
    };
    if (!course.teacherId) {
      return NextResponse.json({ message: 'Course teacher not found' }, { status: 400 });
    }

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `SELECT fullName FROM user WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const studentName = String(studentRows[0]?.fullName || 'Student');

    const [attemptCountRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM course_quiz_attempt
      WHERE courseId = ? AND studentId = ?
      `,
      [normalizedCourseId, user.id]
    );
    const attemptNumber = Number(attemptCountRows[0]?.total || 0) + 1;

    if (answersRaw.length !== COURSE_QUIZ_QUESTION_COUNT) {
      return NextResponse.json(
        { message: `A quiz submission must include exactly ${COURSE_QUIZ_QUESTION_COUNT} questions.` },
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

    if (questionIdSet.size !== COURSE_QUIZ_QUESTION_COUNT) {
      return NextResponse.json(
        { message: `${COURSE_QUIZ_QUESTION_COUNT} unique question IDs are required.` },
        { status: 400 }
      );
    }

    const questionIds = Array.from(questionIdSet);
    const placeholders = questionIds.map(() => '?').join(',');

    const [questionRows] = await pool.query<QuestionRow[]>(
      `
      SELECT id, questionType, questionText, optionsJson, correctOptionIndex
      FROM course_question_bank
      WHERE courseId = ? AND moduleId IS NULL AND id IN (${placeholders})
      `,
      [normalizedCourseId, ...questionIds]
    );

    if (questionRows.length !== COURSE_QUIZ_QUESTION_COUNT) {
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
      const lowerOptions = options.map((option) => option.trim().toLowerCase());
      const looksTrueFalse =
        options.length === 2 &&
        ((lowerOptions[0] === 'true' && lowerOptions[1] === 'false') ||
          (lowerOptions[0] === 'false' && lowerOptions[1] === 'true'));
      const questionType =
        question.questionType ||
        (options.length <= 1
          ? 'written'
          : looksTrueFalse
            ? 'true_false'
            : 'multiple_choice');
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

    const roundedScore = Number(scorePercentage.toFixed(2));
    let certificateIssued = false;
    let certificateId: string | null = null;
    let issuedCertificateNow = false;
    let issuedCertificateOnRetake = false;
    if (roundedScore >= PASSING_SCORE_PERCENTAGE) {
      const certResult = await issueCertificateIfEligible(user.id, normalizedCourseId);
      certificateId = certResult.certificateId;
      certificateIssued = certResult.newlyIssued;
      issuedCertificateNow = certResult.newlyIssued;
      issuedCertificateOnRetake = certResult.newlyIssued && attemptNumber > 1;
    }

    await createQuizNotifications({
      teacherId: course.teacherId,
      studentId: user.id,
      studentName,
      courseId: course.id,
      courseTitle: course.title,
      scorePercentage: roundedScore,
      passed: roundedScore >= PASSING_SCORE_PERCENTAGE,
      attemptNumber,
      issuedCertificateNow,
      issuedCertificateOnRetake,
    });

    if (issuedCertificateNow) {
      await enrollStudentInNextPathCourses({
        studentId: user.id,
        studentName,
        completedCourseId: course.id,
        completedCourseTitle: course.title,
      });
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

