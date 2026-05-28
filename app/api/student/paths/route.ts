import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        lp.id,
        lp.title,
        lp.description,
        lp.imageUrl,
        lp.level,
        lp.price,
        lp.estimatedHours,
        (
          SELECT COALESCE(SUM(COALESCE(c.durationWeeks, 0)), 0)
          FROM learning_path_course lpc
          JOIN course c ON c.id = lpc.courseId
          WHERE lpc.pathId = lp.id
        ) AS estimatedWeeks,
        c.name AS categoryName,
        (
          SELECT COUNT(*)
          FROM learning_path_course lpc
          WHERE lpc.pathId = lp.id
        ) AS coursesCount,
        (
          SELECT COUNT(*)
          FROM path_enrollment pe
          WHERE pe.pathId = lp.id
            AND pe.studentId = ?
        ) AS enrolled,
        (
          SELECT pe.status
          FROM path_enrollment pe
          WHERE pe.pathId = lp.id
            AND pe.studentId = ?
          LIMIT 1
        ) AS enrollmentStatus,
        (
          SELECT pe.progressPercentage
          FROM path_enrollment pe
          WHERE pe.pathId = lp.id
            AND pe.studentId = ?
          LIMIT 1
        ) AS enrollmentProgressPercentage,
        (
          SELECT pe.completedAt
          FROM path_enrollment pe
          WHERE pe.pathId = lp.id
            AND pe.studentId = ?
          LIMIT 1
        ) AS enrollmentCompletedAt
      FROM learning_path lp
      LEFT JOIN category c ON c.id = lp.categoryId
      WHERE lp.status = 'published'
      ORDER BY lp.createdAt DESC
      `,
      [user.id, user.id, user.id, user.id]
    );

    const paths = rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      imageUrl: row.imageUrl as string | null,
      level: row.level as string,
      price: Number(row.price || 0),
      estimatedHours: Number(row.estimatedHours || 0),
      estimatedWeeks: Number(row.estimatedWeeks || 0),
      categoryName: row.categoryName as string | null,
      coursesCount: Number(row.coursesCount || 0),
      enrolled: Number(row.enrolled || 0) > 0,
      enrollmentStatus: row.enrollmentStatus ? String(row.enrollmentStatus) : null,
      enrollmentProgressPercentage: Number(row.enrollmentProgressPercentage || 0),
      enrollmentCompletedAt: row.enrollmentCompletedAt || null,
    }));

    return NextResponse.json({ paths });
  } catch (error: unknown) {
    console.error('Error fetching student paths:', error);
    return NextResponse.json(
      {
        message: 'Failed to load learning paths',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
