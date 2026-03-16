import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();
    const body = await req.json().catch(() => ({}));
    const paymentConfirmed = Boolean(body?.paymentConfirmed);

    if (!paymentConfirmed) {
      return NextResponse.json({ message: 'Payment required' }, { status: 400 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM Course WHERE id = ? AND status = 'published' LIMIT 1`,
      [id]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not available' }, { status: 404 });
    }

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM Enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [id, user.id]
    );

    if (existingRows.length > 0) {
      return NextResponse.json({ success: true, enrollmentId: existingRows[0].id });
    }

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const enrollmentId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO Enrollment
        (id, studentId, courseId, enrolledAt, status, progressPercentage)
      VALUES
        (?, ?, ?, NOW(), 'enrolled', 0)
      `,
      [enrollmentId, user.id, id]
    );

    return NextResponse.json({ success: true, enrollmentId }, { status: 201 });
  } catch (error: any) {
    console.error('Enroll error:', error);
    return NextResponse.json(
      { message: 'Failed to enroll', error: error.message },
      { status: 500 }
    );
  }
}
