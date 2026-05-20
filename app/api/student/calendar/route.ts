import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { hasUnifiedNotificationTable } from '@/lib/notifications-unified';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

type SessionRow = RowDataPacket & {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string | null;
  startAt: string | Date;
  endAt: string | Date;
  meetingLink: string | null;
  status: string;
};

type ReminderRow = RowDataPacket & {
  id: string;
  courseId: string | null;
  title: string;
  message: string;
  createdAt: string | Date;
};

type DeliverableRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  questionCount: number;
  bestScore: number;
  unlockedAt: string | Date | null;
};

type MissRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  missedCount: number;
};

type CourseStatRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  totalLectures: number;
  completedLectures: number;
  upcomingLectures: number;
  missedCount: number;
};

function toIsoString(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseReminderDate(message: string, fallback: string | Date) {
  const match = /on\s+(\d{4}-\d{2}-\d{2})\s+at\s+(\d{2}:\d{2})/i.exec(message || '');
  if (match) {
    const parsed = new Date(`${match[1]}T${match[2]}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return toIsoString(fallback);
}

async function ensureLiveSessionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS live_session (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      teacherId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
      description TEXT NULL COLLATE utf8mb4_unicode_ci,
      startAt DATETIME NOT NULL,
      endAt DATETIME NOT NULL,
      meetingLink VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
      status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_live_session_course (courseId),
      INDEX idx_live_session_teacher (teacherId),
      INDEX idx_live_session_start (startAt)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_live_miss (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      missedCount INT DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_student_course_miss (studentId, courseId),
      INDEX idx_student_miss_student (studentId),
      INDEX idx_student_miss_course (courseId)
    ) ENGINE=InnoDB
  `);
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();
    await ensureLiveSessionTables();
    const useUnifiedNotifications = await hasUnifiedNotificationTable();

    const [sessionRows] = await pool.query<SessionRow[]>(
      `
      SELECT
        s.id,
        s.courseId,
        c.title AS courseTitle,
        s.title,
        s.description,
        s.startAt,
        s.endAt,
        s.meetingLink,
        s.status
      FROM live_session s
      JOIN enrollment e ON e.courseId = s.courseId
      JOIN course c ON c.id = s.courseId
      WHERE e.studentId = ?
        AND e.status IN ('enrolled', 'in_progress', 'completed')
      ORDER BY s.startAt ASC
      LIMIT 200
      `,
      [user.id]
    );

    const reminderQuery = useUnifiedNotifications
      ? `
        SELECT id, courseId, title, message, createdAt
        FROM notification
        WHERE recipientRole = 'student'
          AND recipientId = ?
          AND type = 'live_session'
          AND deletedAt IS NULL
        ORDER BY createdAt DESC
        LIMIT 120
      `
      : `
        SELECT id, courseId, title, message, createdAt
        FROM student_notification
        WHERE studentId = ?
          AND type = 'live_session'
        ORDER BY createdAt DESC
        LIMIT 120
      `;
    const [reminderRows] = await pool.query<ReminderRow[]>(reminderQuery, [user.id]);

    const [deliverableRows] = await pool.query<DeliverableRow[]>(
      `
      SELECT
        c.id AS courseId,
        c.title AS courseTitle,
        COUNT(DISTINCT qb.id) AS questionCount,
        COALESCE(MAX(qa.scorePercentage), 0) AS bestScore,
        MAX(e.completedAt) AS unlockedAt
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
         AND COALESCE(MAX(qa.scorePercentage), 0) < 60
      ORDER BY c.title ASC
      `,
      [user.id]
    );

    const [missRows] = await pool.query<MissRow[]>(
      `
      SELECT
        m.courseId,
        c.title AS courseTitle,
        m.missedCount
      FROM student_live_miss m
      JOIN course c ON c.id = m.courseId
      WHERE m.studentId = ?
      ORDER BY m.missedCount DESC, c.title ASC
      `,
      [user.id]
    );

    const [courseStatRows] = await pool.query<CourseStatRow[]>(
      `
      SELECT
        e.courseId,
        c.title AS courseTitle,
        COUNT(s.id) AS totalLectures,
        SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completedLectures,
        SUM(CASE WHEN s.status = 'scheduled' THEN 1 ELSE 0 END) AS upcomingLectures,
        COALESCE(MAX(m.missedCount), 0) AS missedCount
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      LEFT JOIN live_session s ON s.courseId = e.courseId
      LEFT JOIN student_live_miss m
        ON m.courseId = e.courseId
       AND m.studentId = e.studentId
      WHERE e.studentId = ?
        AND e.status IN ('enrolled', 'in_progress', 'completed')
      GROUP BY e.courseId, c.title
      ORDER BY c.title ASC
      `,
      [user.id]
    );

    const sessions = sessionRows.map((row) => ({
      id: row.id,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      title: row.title,
      description: row.description || '',
      startAt: toIsoString(row.startAt),
      endAt: toIsoString(row.endAt),
      meetingLink: row.meetingLink || null,
      status: row.status || 'scheduled',
      source: 'session',
    }));

    const reminders = reminderRows.map((row) => ({
      id: row.id,
      courseId: row.courseId || null,
      title: row.title,
      message: row.message,
      eventAt: parseReminderDate(row.message, row.createdAt),
      createdAt: toIsoString(row.createdAt),
      source: 'notification',
    }));

    const deliverables = deliverableRows.map((row) => ({
      id: `${row.courseId}-final-quiz`,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      title: 'Final Quiz Delivery',
      detail: `Pass at least 60% (${Number(row.questionCount || 0)} questions).`,
      bestScore: Math.round(Number(row.bestScore || 0)),
      unlockedAt: toIsoString(row.unlockedAt),
      status: 'pending',
    }));

    const absences = missRows.map((row) => ({
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      missedCount: Number(row.missedCount || 0),
    }));

    const totalAbsences = absences.reduce((sum, row) => sum + row.missedCount, 0);
    const totalLectures = courseStatRows.reduce((sum, row) => sum + Number(row.totalLectures || 0), 0);
    const totalLectureNotifications = reminders.length;

    const courseStats = courseStatRows.map((row) => ({
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      totalLectures: Number(row.totalLectures || 0),
      completedLectures: Number(row.completedLectures || 0),
      upcomingLectures: Number(row.upcomingLectures || 0),
      missedCount: Number(row.missedCount || 0),
    }));

    return NextResponse.json({
      summary: {
        totalSessions: totalLectures || sessions.length,
        totalReminders: totalLectureNotifications,
        totalDeliverables: deliverables.length,
        totalAbsences,
      },
      sessions,
      reminders,
      deliverables,
      absences,
      courseStats,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Student calendar error:', error);
    return NextResponse.json(
      { message: 'Failed to load student calendar', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
