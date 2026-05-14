import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type Insight = {
  type: 'forecast' | 'trend' | 'recommendation';
  title: string;
  description: string;
};

type CourseProgressRow = RowDataPacket & {
  title: string;
  students: number;
  avgProgress: number | null;
};

type StudentRiskRow = RowDataPacket & {
  fullName: string;
  progressPercentage: number;
  courseTitle: string;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const teacherId = user.id;

    const [courseRows] = await pool.query<CourseProgressRow[]>(
      `
      SELECT
        c.title,
        COUNT(e.id) AS students,
        AVG(e.progressPercentage) AS avgProgress
      FROM course c
      LEFT JOIN enrollment e ON e.courseId = c.id
      WHERE c.teacherId = ?
      GROUP BY c.id, c.title
      ORDER BY students DESC
      `,
      [teacherId]
    );

    const [riskRows] = await pool.query<StudentRiskRow[]>(
      `
      SELECT
        u.fullName,
        e.progressPercentage,
        c.title AS courseTitle
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
        AND e.status IN ('enrolled', 'in_progress')
        AND e.progressPercentage < 40
      ORDER BY e.progressPercentage ASC
      LIMIT 5
      `,
      [teacherId]
    );

    const totalCourses = courseRows.length;
    const totalStudents = courseRows.reduce((sum, row) => sum + Number(row.students || 0), 0);
    const avgProgressAll =
      totalCourses > 0
        ? courseRows.reduce((sum, row) => sum + Number(row.avgProgress || 0), 0) / totalCourses
        : 0;

    const topCourse = courseRows[0];
    const weakCourse = [...courseRows]
      .filter((row) => Number(row.students || 0) > 0)
      .sort((a, b) => Number(a.avgProgress || 0) - Number(b.avgProgress || 0))[0];

    const atRiskCount = riskRows.length;
    const atRiskPct = totalStudents > 0 ? (atRiskCount / totalStudents) * 100 : 0;

    const insights: Insight[] = [
      {
        type: 'forecast',
        title: 'Class Progress Outlook',
        description:
          avgProgressAll >= 70
            ? `Overall learner progress is strong (${avgProgressAll.toFixed(0)}%).`
            : `Overall learner progress is moderate (${avgProgressAll.toFixed(0)}%). Focus on completion support.`,
      },
      {
        type: 'trend',
        title: 'Learner Risk Trend',
        description:
          atRiskCount === 0
            ? 'No students are currently flagged as at-risk by progress.'
            : `${atRiskCount} students are below 40% progress (${atRiskPct.toFixed(0)}% of active learners).`,
      },
      {
        type: 'recommendation',
        title: 'Teaching Recommendation',
        description:
          weakCourse && topCourse
            ? `Prioritize support in "${weakCourse.title}" and replicate engagement patterns from "${topCourse.title}".`
            : 'Run a short weekly check-in and add one quick formative quiz per active course.',
      },
    ];

    return NextResponse.json({
      insights,
      source: 'rule-based',
      context: {
        totalCourses,
        totalStudents,
        avgProgressAll: Number(avgProgressAll.toFixed(2)),
        topCourse: topCourse
          ? {
              title: topCourse.title,
              students: Number(topCourse.students || 0),
              avgProgress: Number(topCourse.avgProgress || 0),
            }
          : null,
        weakCourse: weakCourse
          ? {
              title: weakCourse.title,
              students: Number(weakCourse.students || 0),
              avgProgress: Number(weakCourse.avgProgress || 0),
            }
          : null,
        atRiskStudents: riskRows.map((row) => ({
          fullName: String(row.fullName || 'Unknown'),
          progressPercentage: Number(row.progressPercentage || 0),
          courseTitle: String(row.courseTitle || 'Course'),
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Teacher AI insights error:', error);
    return NextResponse.json(
      {
        message: 'Failed to generate insights',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

