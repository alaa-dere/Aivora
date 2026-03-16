import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();

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
        EXISTS(
          SELECT 1 FROM Enrollment e 
          WHERE e.courseId = c.id AND e.studentId = ?
        ) AS enrolled
      FROM Course c
      JOIN User u ON u.id = c.teacherId
      WHERE c.id = ?
      LIMIT 1
      `,
      [user.id, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const row = rows[0];
    const course = {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl || '/default-course.jpg',
      durationWeeks: Number(row.durationWeeks || 0),
      price: Number(row.price || 0),
      teacherName: row.teacherName || 'Unknown',
      status: row.status,
      enrolled: Boolean(row.enrolled),
    };

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Student course detail error:', error);
    return NextResponse.json(
      { message: 'Failed to load course', error: error.message },
      { status: 500 }
    );
  }
}
