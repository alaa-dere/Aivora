import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ pathId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { pathId } = await params;
    const id = decodeURIComponent(pathId).trim();

    const [pathRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT lp.id, lp.title, lp.description, lp.imageUrl
      FROM learning_path lp
      JOIN path_enrollment pe ON pe.pathId = lp.id
      WHERE lp.id = ?
        AND pe.studentId = ?
      LIMIT 1
      `,
      [id, user.id]
    );

    if (pathRows.length === 0) {
      return NextResponse.json({ message: 'Path not found or not enrolled' }, { status: 404 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        lpc.courseId,
        lpc.orderNumber,
        c.title AS courseTitle,
        c.imageUrl AS courseImageUrl,
        c.durationWeeks,
        u.fullName AS teacherName,
        e.status AS enrollmentStatus,
        e.progressPercentage,
        e.completedAt
      FROM learning_path_course lpc
      JOIN course c ON c.id = lpc.courseId
      JOIN user u ON u.id = c.teacherId
      LEFT JOIN enrollment e
        ON e.courseId = lpc.courseId
       AND e.studentId = ?
      WHERE lpc.pathId = ?
        AND c.status = 'published'
      ORDER BY lpc.orderNumber ASC
      `,
      [user.id, id]
    );

    const courses = courseRows.map((row) => {
      const progress = Number(row.progressPercentage || 0);
      const status = String(row.enrollmentStatus || '').toLowerCase();
      const completed = status === 'completed' || progress >= 100;
      const inProgress = !completed && (status === 'in_progress' || status === 'enrolled' || progress > 0);
      return {
        id: String(row.courseId || ''),
        orderNumber: Number(row.orderNumber || 0),
        title: String(row.courseTitle || 'Course'),
        imageUrl: String(row.courseImageUrl || '/default-course.jpg'),
        teacherName: String(row.teacherName || 'Unknown'),
        durationWeeks: Number(row.durationWeeks || 0),
        progressPercentage: progress,
        status: completed ? 'completed' : inProgress ? 'in_progress' : 'not_started',
        completedAt: row.completedAt || null,
        paidViaPath: true,
      };
    });

    return NextResponse.json({
      path: {
        id: String(pathRows[0].id),
        title: String(pathRows[0].title || 'Learning Path'),
        description: String(pathRows[0].description || ''),
        imageUrl: String(pathRows[0].imageUrl || '/default-course.jpg'),
      },
      courses,
    });
  } catch (error: unknown) {
    console.error('Student path courses error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load path courses',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
