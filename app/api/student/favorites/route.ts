import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseEvaluationSchema } from '@/lib/ensure-course-evaluation-schema';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
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
        u.fullName AS teacherName,
        c.status,
        (
          SELECT COUNT(*)
          FROM lesson l
          JOIN module m ON m.id = l.moduleId
          WHERE m.courseId = c.id
            AND l.isPublished = TRUE
        ) AS lessonCount,
        (
          SELECT COUNT(*)
          FROM enrollment e2
          WHERE e2.courseId = c.id
        ) AS studentCount,
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
        EXISTS(
          SELECT 1 FROM enrollment e 
          WHERE e.courseId = c.id AND e.studentId = ?
        ) AS enrolled
      FROM favorite_course f
      JOIN course c ON c.id = f.courseId
      JOIN user u ON u.id = c.teacherId
      WHERE f.studentId = ?
      ORDER BY f.createdAt DESC
      `,
      [user.id, user.id]
    );

    const favorites = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl || '/default-course.jpg',
      durationWeeks: Number(row.durationWeeks || 0),
      price: Number(row.price || 0),
      teacherName: row.teacherName || 'Unknown',
      lessonCount: Number(row.lessonCount || 0),
      studentCount: Number(row.studentCount || 0),
      averageRating:
        row.averageRating === null || row.averageRating === undefined
          ? 0
          : Number(row.averageRating),
      evaluationCount: Number(row.evaluationCount || 0),
      status: row.status,
      enrolled: Boolean(row.enrolled),
    }));

    return NextResponse.json({ favorites });
  } catch (error: unknown) {
    console.error('Student favorites error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load favorites',
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

  const body = await req.json().catch(() => null);
  const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
  if (!courseId) {
    return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
  }

  try {
    await pool.query<OkPacket>(
      `
      INSERT IGNORE INTO favorite_course (studentId, courseId, createdAt)
      VALUES (?, ?, NOW())
      `,
      [user.id, courseId]
    );

    return NextResponse.json({ success: true, favorite: true });
  } catch (error: unknown) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      {
        message: 'Failed to add favorite',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
  if (!courseId) {
    return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
  }

  try {
    await pool.query<OkPacket>(
      `DELETE FROM favorite_course WHERE studentId = ? AND courseId = ?`,
      [user.id, courseId]
    );

    return NextResponse.json({ success: true, favorite: false });
  } catch (error: unknown) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      {
        message: 'Failed to remove favorite',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
