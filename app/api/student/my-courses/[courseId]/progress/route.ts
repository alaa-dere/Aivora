import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';
import { randomUUID } from 'crypto';

interface Params {
  params: Promise<{ courseId: string }>;
}

const PASSING_SCORE_PERCENTAGE = 60;

function normalizeAnswer(value: string) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function extractExpectedAnswer(content: string) {
  const match = /\{\{\s*(?:answer|expected)\s*:\s*([\s\S]*?)\}\}/i.exec(content || '');
  return match ? normalizeAnswer(match[1]) : '';
}

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
    const event = String(body?.event || 'complete').trim();
    const liveEditorSubmission = body?.liveEditorSubmission || null;

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

    const [lessonRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        l.id,
        l.enableLiveEditor,
        l.liveEditorLanguage,
        l.content
      FROM lesson l
      JOIN module m ON m.id = l.moduleId
      WHERE l.id = ? AND m.courseId = ?
      LIMIT 1
      `,
      [lessonId, id]
    );
    if (lessonRows.length === 0) {
      return NextResponse.json({ message: 'Lesson not found in this course' }, { status: 404 });
    }
    const lesson = lessonRows[0];

    if (event === 'start') {
      if (existing.length === 0) {
        const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
        const progressId = idRows[0].id as string;
        await pool.query<ResultSetHeader>(
          `
          INSERT INTO lessonprogress
            (id, enrollmentId, lessonId, completed, progressPercentage, startedAt, completedAt)
          VALUES
            (?, ?, ?, FALSE, 0, NOW(), NULL)
          `,
          [progressId, enrollmentId, lessonId]
        );
      } else {
        await pool.query<ResultSetHeader>(
          `
          UPDATE lessonprogress
          SET startedAt = NOW()
          WHERE id = ?
          `,
          [existing[0].id]
        );
      }

      return NextResponse.json({ success: true, event: 'start' });
    }

    if (event === 'issue_certificate') {
      await ensureCourseQuizSchema();
      await ensureTeacherNotificationTable();

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

      if (totalLessons === 0 || completedLessons < totalLessons) {
        return NextResponse.json(
          { message: 'Complete all lessons before receiving the certificate' },
          { status: 400 }
        );
      }

      const [quizRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT MAX(scorePercentage) AS bestScore
        FROM course_quiz_attempt
        WHERE courseId = ? AND studentId = ?
        `,
        [id, user.id]
      );
      const bestScore = Number(quizRows[0]?.bestScore || 0);
      if (bestScore < PASSING_SCORE_PERCENTAGE) {
        return NextResponse.json(
          {
            message: `Score at least ${PASSING_SCORE_PERCENTAGE}% in the course quiz to unlock your certificate`,
            bestScore,
            passingScorePercentage: PASSING_SCORE_PERCENTAGE,
          },
          { status: 400 }
        );
      }

      const [certRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
        [user.id, id]
      );

      if (certRows.length === 0) {
        const [courseRows] = await pool.query<RowDataPacket[]>(
          `SELECT title, teacherId FROM course WHERE id = ? LIMIT 1`,
          [id]
        );
        const courseTitle = String(courseRows[0]?.title || 'Course');
        const teacherId = String(courseRows[0]?.teacherId || '');
        const code = courseTitle
          .split(/\s+/)
          .map((w) => w.replace(/[^a-z0-9]/gi, '').slice(0, 1))
          .join('')
          .toUpperCase()
          .slice(0, 6) || 'AIV';

        const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
        const certId = idRows[0].id as string;
        const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const certNo = `AIV-${code}-${dateStamp}-${certId.slice(0, 6).toUpperCase()}`;

        await pool.query<ResultSetHeader>(
          `
          INSERT INTO certificate
            (id, studentId, courseId, certificateNo, issuedAt, createdAt, updatedAt)
          VALUES
            (?, ?, ?, ?, NOW(), NOW(), NOW())
          `,
          [certId, user.id, id, certNo]
        );

        const [studentRows] = await pool.query<RowDataPacket[]>(
          `SELECT fullName FROM user WHERE id = ? LIMIT 1`,
          [user.id]
        );
        const studentName = String(studentRows[0]?.fullName || 'Student');
        const title = 'Certificate unlocked';
        const message = `${studentName} unlocked the certificate for ${courseTitle}.`;

        if (teacherId) {
          await pool.query<ResultSetHeader>(
            `
            INSERT INTO teacher_notification
              (id, teacherId, studentId, courseId, type, title, message, createdAt)
            VALUES
              (?, ?, ?, ?, 'quiz_certificate', ?, ?, NOW())
            `,
            [randomUUID(), teacherId, user.id, id, title, message]
          );
        }

        await pool.query<ResultSetHeader>(
          `
          INSERT INTO admin_notification
            (id, type, title, message, studentId, courseId, createdAt)
          VALUES
            (?, 'course_enroll', ?, ?, ?, ?, NOW())
          `,
          [randomUUID(), title, message, user.id, id]
        );

        return NextResponse.json({ success: true, certificateId: certId });
      }

      return NextResponse.json({ success: true, certificateId: certRows[0].id as string });
    }

    if (Boolean(lesson.enableLiveEditor)) {
      const expectedAnswer = extractExpectedAnswer(String(lesson.content || ''));
      if (!expectedAnswer) {
        return NextResponse.json(
          {
            message:
              'This live-compiler lesson does not have an expected answer yet. Ask your teacher to add {{answer: ...}} in lesson content.',
          },
          { status: 400 }
        );
      }

      const submittedCode = normalizeAnswer(String(liveEditorSubmission?.code || ''));
      const submittedOutput = normalizeAnswer(String(liveEditorSubmission?.output || ''));
      const hasRun = Boolean(liveEditorSubmission?.hasRun);
      const language = String(lesson.liveEditorLanguage || 'python');

      const candidate =
        language === 'html_css'
          ? submittedCode
          : submittedOutput || submittedCode;

      if (!candidate) {
        return NextResponse.json(
          { message: 'Solve the live compiler task before completing this lesson.' },
          { status: 400 }
        );
      }

      if (language !== 'html_css' && !hasRun) {
        return NextResponse.json(
          { message: 'Run your code and get the correct answer before completing this lesson.' },
          { status: 400 }
        );
      }

      if (candidate !== expectedAnswer) {
        return NextResponse.json(
          { message: 'Your live compiler answer is not correct yet. Please try again.' },
          { status: 400 }
        );
      }
    }

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
        SET completed = TRUE,
            progressPercentage = 100,
            startedAt = IFNULL(startedAt, NOW()),
            completedAt = NOW()
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
      SET progressPercentage = ?, status = IF(?, 'completed', status),
          completedAt = IF(?, NOW(), completedAt)
      WHERE id = ?
      `,
      [
        progressPercentage,
        completedLessons === totalLessons && totalLessons > 0,
        completedLessons === totalLessons && totalLessons > 0,
        enrollmentId,
      ]
    );

    let needsCertificateChoice = false;
    let certificateId: string | null = null;
    if (completedLessons === totalLessons && totalLessons > 0) {
      const [certRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
        [user.id, id]
      );
      if (certRows.length > 0) {
        certificateId = certRows[0].id as string;
      } else {
        needsCertificateChoice = true;
      }
    }

    return NextResponse.json({
      success: true,
      progressPercentage,
      completedLessons,
      totalLessons,
      needsCertificateChoice,
      certificateId,
    });
  } catch (error: unknown) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      {
        message: 'Failed to update progress',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
