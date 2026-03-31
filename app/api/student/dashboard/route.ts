import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type EnrollmentRow = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const notifications = searchParams.get('notifications');

    if (notifications) {
      if (notifications === 'count') {
        const [countRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM student_notification
          WHERE studentId = ? AND readAt IS NULL
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
          c.title AS courseTitle
        FROM student_notification n
        LEFT JOIN course c ON c.id = n.courseId
        WHERE n.studentId = ?
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

    // Study time: last 7 days from completed lessons (minutes)
    const [studyRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        DATE_FORMAT(COALESCE(lp.completedAt, lp.startedAt), '%Y-%m-%d') AS day,
        COALESCE(
          SUM(
            GREATEST(
              TIMESTAMPDIFF(
                MINUTE,
                lp.startedAt,
                CASE
                  WHEN lp.completed = 1 AND lp.completedAt IS NOT NULL THEN lp.completedAt
                  ELSE NOW()
                END
              ),
              0
            )
          ),
          0
        ) AS minutes
      FROM lessonprogress lp
      JOIN lesson l ON l.id = lp.lessonId
      JOIN enrollment e ON e.id = lp.enrollmentId
      WHERE e.studentId = ?
        AND lp.startedAt IS NOT NULL
        AND COALESCE(lp.completedAt, lp.startedAt) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(COALESCE(lp.completedAt, lp.startedAt), '%Y-%m-%d')
      ORDER BY DATE_FORMAT(COALESCE(lp.completedAt, lp.startedAt), '%Y-%m-%d')
      `,
      [user.id]
    );

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD in server local time
      const match = studyRows.find((r: any) => String(r.day) === key);
      last7.push({
        day: days[d.getDay()],
        minutes: Number(match?.minutes || 0),
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

    return NextResponse.json({
      stats: {
        enrolledCourses,
        inProgress,
        avgScore: avgProgress,
        completion: avgProgress,
      },
      studyData: last7,
      continueLearning,
      recentQuizzes: [],
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

    if (action === 'mark_notification_read') {
      const id = String(body?.id || '').trim();
      if (!id) {
        return NextResponse.json({ message: 'Notification id required' }, { status: 400 });
      }
      await pool.query(
        `UPDATE student_notification SET readAt = NOW() WHERE id = ? AND studentId = ?`,
        [id, user.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_notifications_read') {
      await pool.query(
        `UPDATE student_notification SET readAt = NOW() WHERE studentId = ? AND readAt IS NULL`,
        [user.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_notification') {
      const id = String(body?.id || '').trim();
      if (!id) {
        return NextResponse.json({ message: 'Notification id required' }, { status: 400 });
      }
      await pool.query(
        `DELETE FROM student_notification WHERE id = ? AND studentId = ?`,
        [id, user.id]
      );
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
