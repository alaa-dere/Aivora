import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ pathId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const conn = await pool.getConnection();
  try {
    const { pathId } = await params;
    const id = decodeURIComponent(pathId).trim();
    const body = await req.json().catch(() => ({}));
    const paymentConfirmed = Boolean(body?.paymentConfirmed);

    const [pathRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT id, title, price
      FROM learning_path
      WHERE id = ? AND status = 'published'
      LIMIT 1
      `,
      [id]
    );

    if (pathRows.length === 0) {
      return NextResponse.json({ message: 'Learning path not available' }, { status: 404 });
    }
    const selectedPath = pathRows[0];
    const pathPrice = Number(selectedPath.price || 0);

    if (pathPrice > 0 && !paymentConfirmed) {
      return NextResponse.json(
        { message: 'Payment confirmation is required for this learning path' },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    await conn.query<ResultSetHeader>(
      `
      INSERT IGNORE INTO path_enrollment
        (id, pathId, studentId, enrolledAt, status, progressPercentage)
      VALUES
        (UUID(), ?, ?, NOW(), 'enrolled', 0)
      `,
      [id, user.id]
    );

    const [courseMapRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT lpc.courseId
      FROM learning_path_course lpc
      JOIN course c ON c.id = lpc.courseId
      WHERE lpc.pathId = ?
        AND c.status = 'published'
      ORDER BY lpc.orderNumber ASC
      `,
      [id]
    );

    for (const row of courseMapRows) {
      const courseId = String(row.courseId || '').trim();
      if (!courseId) continue;
      await conn.query<ResultSetHeader>(
        `
        INSERT IGNORE INTO enrollment
          (id, studentId, courseId, enrolledAt, status, progressPercentage)
        VALUES
          (UUID(), ?, ?, NOW(), 'enrolled', 0)
        `,
        [user.id, courseId]
      );
    }

    await conn.commit();

    return NextResponse.json(
      {
        success: true,
        message: 'Enrolled in path successfully',
        pathId: id,
        coursesEnrolled: courseMapRows.length,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    await conn.rollback();
    console.error('Path enrollment error:', error);
    return NextResponse.json(
      {
        message: 'Failed to enroll in path',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
