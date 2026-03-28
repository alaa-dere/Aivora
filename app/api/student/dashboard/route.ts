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
