import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { hasUnifiedNotificationTable } from '@/lib/notifications-unified';

type EnrollmentRow = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
};

type StudyRow = RowDataPacket & {
  day: string;
  minutes: number;
};

type RecentQuizRow = RowDataPacket & {
  id: string;
  course: string;
  score: number;
  date: string | Date;
};

async function ensureStudySessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_study_session (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      enrollmentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      lessonId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      startedAt DATETIME NOT NULL,
      endedAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_lss_enrollment (enrollmentId),
      INDEX idx_lss_lesson (lessonId),
      INDEX idx_lss_started (startedAt),
      INDEX idx_lss_ended (endedAt),
      CONSTRAINT fk_lss_enrollment FOREIGN KEY (enrollmentId) REFERENCES enrollment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_lss_lesson FOREIGN KEY (lessonId) REFERENCES lesson(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureStudySessionTable();
    const { searchParams } = new URL(req.url);
    const notifications = searchParams.get('notifications');
    const useUnified = await hasUnifiedNotificationTable();

    if (notifications) {
      if (notifications === 'count') {
        const [countRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM ${useUnified ? 'notification' : 'student_notification'}
          WHERE ${useUnified ? "recipientRole = 'student' AND recipientId = ?" : 'studentId = ?'} AND readAt IS NULL
          ${useUnified ? 'AND deletedAt IS NULL' : ''}
          `,
          [user.id]
        );
        const total = Number(countRows[0]?.total || 0);
        return NextResponse.json({ total });
      }

      const limit = notifications === 'all' ? 100 : 5;
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          n.id,
          n.type,
          n.title,
          n.message,
          n.createdAt,
          n.readAt,
          n.courseId,
          c.title AS courseTitle,
          cert.id AS certificateId
        FROM ${useUnified ? 'notification' : 'student_notification'} n
        LEFT JOIN course c ON c.id = n.courseId
        LEFT JOIN certificate cert
          ON cert.studentId = ${useUnified ? 'n.relatedUserId' : 'n.studentId'}
         AND cert.courseId = n.courseId
        WHERE ${useUnified ? "n.recipientRole = 'student' AND n.recipientId = ? AND n.deletedAt IS NULL" : 'n.studentId = ?'}
        ORDER BY n.createdAt DESC
        LIMIT ${limit}
        `,
        [user.id]
      );

      return NextResponse.json({
        notifications: rows.map((row) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message,
          createdAt: row.createdAt,
          readAt: row.readAt,
          courseId: row.courseId,
          courseTitle: row.courseTitle,
          certificateId: row.certificateId || null,
        })),
      });
    }

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        e.id AS enrollmentId,
        e.courseId,
        c.title AS courseTitle,
        e.progressPercentage
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      WHERE e.studentId = ?
      ORDER BY e.enrolledAt DESC
      `,
      [user.id]
    );

    const enrollments = enrollRows as EnrollmentRow[];
    const enrolledCourses = enrollments.length;
    const inProgress = enrollments.filter(
      (e) => e.progressPercentage > 0 && e.progressPercentage < 100
    ).length;
    const avgProgress =
      enrolledCourses > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + Number(e.progressPercentage || 0), 0) /
              enrolledCourses
          )
        : 0;

    // Study time: last 7 days from lesson sessions (minutes)
    // Session minutes are capped to avoid runaway values from abandoned sessions.
    const [studyRows] = await pool.query<StudyRow[]>(
      `
      SELECT
        DATE_FORMAT(s.startedAt, '%Y-%m-%d') AS day,
        COALESCE(
          SUM(
            LEAST(
              GREATEST(
                TIMESTAMPDIFF(
                  MINUTE,
                  s.startedAt,
                  CASE
                    WHEN s.endedAt IS NOT NULL AND s.endedAt >= s.startedAt THEN s.endedAt
                    ELSE NOW()
                  END
                ),
                0
              ),
              180
            )
          ),
          0
        ) AS minutes
      FROM lesson_study_session s
      JOIN enrollment e ON e.id = s.enrollmentId
      WHERE e.studentId = ?
        AND s.startedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(s.startedAt, '%Y-%m-%d')
      ORDER BY DATE_FORMAT(s.startedAt, '%Y-%m-%d')
      `,
      [user.id]
    );

    const studyByDay = new Map<string, number>();
    for (const row of studyRows) {
      studyByDay.set(String(row.day), Number(row.minutes || 0));
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      last7.push({
        day: days[d.getDay()],
        minutes: Number(studyByDay.get(key) || 0),
      });
    }

    // Continue learning: pick top 3 courses with next unlocked lesson
    const continueLearning: Array<{
      id: string;
      title: string;
      progress: number;
      nextLesson: string;
    }> = [];

    for (const enrollment of enrollments.slice(0, 3)) {
      const [lessonRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT 
          l.id,
          l.title,
          l.orderNumber,
          lp.completed AS completed
        FROM lesson l
        JOIN module m ON m.id = l.moduleId
        LEFT JOIN lessonprogress lp
          ON lp.lessonId = l.id AND lp.enrollmentId = ?
        WHERE m.courseId = ? AND l.isPublished = TRUE
        ORDER BY m.orderNumber ASC, l.orderNumber ASC
        `,
        [enrollment.enrollmentId, enrollment.courseId]
      );

      let nextLesson = 'Start course';
      let unlockNext = true;
      for (const lesson of lessonRows) {
        if (unlockNext && !lesson.completed) {
          nextLesson = lesson.title;
          break;
        }
        unlockNext = Boolean(lesson.completed);
      }

      continueLearning.push({
        id: enrollment.courseId,
        title: enrollment.courseTitle,
        progress: Math.round(Number(enrollment.progressPercentage || 0)),
        nextLesson,
      });
    }

    const [recentQuizRows] = await pool.query<RecentQuizRow[]>(
      `
      SELECT
        qa.id,
        c.title AS course,
        qa.scorePercentage AS score,
        qa.createdAt AS date
      FROM course_quiz_attempt qa
      JOIN course c ON c.id = qa.courseId
      WHERE qa.studentId = ?
      ORDER BY qa.createdAt DESC
      LIMIT 5
      `,
      [user.id]
    );

    return NextResponse.json({
      stats: {
        enrolledCourses,
        inProgress,
        avgScore: avgProgress,
        completion: avgProgress,
      },
      studyData: last7,
      continueLearning,
      recentQuizzes: recentQuizRows.map((row) => ({
        id: row.id,
        course: row.course,
        score: Math.round(Number(row.score || 0)),
        date: row.date ? new Date(row.date).toLocaleDateString() : '-',
      })),
    });
  } catch (error: any) {
    console.error('Student dashboard error:', error);
    return NextResponse.json(
      { message: 'Failed to load student dashboard', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = String(body?.action || '');
    const useUnified = await hasUnifiedNotificationTable();

    if (action === 'mark_notification_read') {
      const id = String(body?.id || '').trim();
      if (!id) {
        return NextResponse.json({ message: 'Notification id required' }, { status: 400 });
      }
      if (useUnified) {
        await pool.query(
          `UPDATE notification SET readAt = NOW() WHERE id = ? AND recipientRole = 'student' AND recipientId = ? AND deletedAt IS NULL`,
          [id, user.id]
        );
      } else {
        await pool.query(
          `UPDATE student_notification SET readAt = NOW() WHERE id = ? AND studentId = ?`,
          [id, user.id]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_notifications_read') {
      if (useUnified) {
        await pool.query(
          `UPDATE notification SET readAt = NOW() WHERE recipientRole = 'student' AND recipientId = ? AND deletedAt IS NULL AND readAt IS NULL`,
          [user.id]
        );
      } else {
        await pool.query(
          `UPDATE student_notification SET readAt = NOW() WHERE studentId = ? AND readAt IS NULL`,
          [user.id]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_notification') {
      const id = String(body?.id || '').trim();
      if (!id) {
        return NextResponse.json({ message: 'Notification id required' }, { status: 400 });
      }
      if (useUnified) {
        await pool.query(
          `UPDATE notification SET deletedAt = NOW() WHERE id = ? AND recipientRole = 'student' AND recipientId = ? AND deletedAt IS NULL`,
          [id, user.id]
        );
      } else {
        await pool.query(
          `DELETE FROM student_notification WHERE id = ? AND studentId = ?`,
          [id, user.id]
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('Student notifications error:', error);
    return NextResponse.json(
      { message: 'Failed to update notifications', error: error.message },
      { status: 500 }
    );
  }
}
