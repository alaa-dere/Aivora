import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { randomUUID } from 'crypto';
import { getRequestUser } from '@/lib/request-auth';
import { ensureRecentCourseViewSchema } from '@/lib/ensure-recent-course-view-schema';
import { ensureCourseEvaluationSchema } from '@/lib/ensure-course-evaluation-schema';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureRecentCourseViewSchema();
    await ensureCourseEvaluationSchema();

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.imageUrl,
        c.durationWeeks,
        c.price,
        u.fullName AS instructor,
        (
          SELECT COUNT(*)
          FROM enrollment e
          WHERE e.courseId = c.id
        ) AS studentsCount,
        (
          SELECT AVG(ce.rating)
          FROM course_evaluation ce
          WHERE ce.courseId = c.id
            AND ce.rating IS NOT NULL
        ) AS averageRating,
        (
          SELECT COUNT(*)
          FROM course_evaluation ce
          WHERE ce.courseId = c.id
            AND ce.rating IS NOT NULL
        ) AS evaluationCount,
        rcv.lastViewedAt
      FROM recent_course_view rcv
      JOIN course c ON c.id = rcv.courseId
      JOIN user u ON u.id = c.teacherId
      WHERE rcv.studentId = ?
        AND c.status = 'published'
      ORDER BY rcv.lastViewedAt DESC
      LIMIT 12
      `,
      [user.id]
    );

    const courses = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl || '/default-course.jpg',
      durationWeeks: Number(row.durationWeeks || 0),
      price: Number(row.price || 0),
      instructor: row.instructor || 'Unknown',
      students: Number(row.studentsCount || 0),
      averageRating:
        row.averageRating === null || row.averageRating === undefined
          ? 0
          : Number(row.averageRating),
      evaluationCount: Number(row.evaluationCount || 0),
      lastViewedAt: row.lastViewedAt,
    }));

    return NextResponse.json({ courses });
  } catch (error: unknown) {
    console.error('Recent courses error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load recent courses',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
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
    await ensureRecentCourseViewSchema();

    const body = await req.json().catch(() => ({}));
    const courseId = String(body?.courseId || '');
    if (!courseId) {
      return NextResponse.json(
        { message: 'courseId is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `
      INSERT INTO recent_course_view (id, studentId, courseId, lastViewedAt)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE lastViewedAt = NOW()
      `,
      [randomUUID(), user.id, courseId]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Track recent course error:', error);
    return NextResponse.json(
      {
        message: 'Failed to track recent course',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
