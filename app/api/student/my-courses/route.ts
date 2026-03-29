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
        c.id,
        c.title,
        c.description,
        c.imageUrl,
        e.progressPercentage AS progress
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      WHERE e.studentId = ?
      ORDER BY e.enrolledAt DESC
      `,
      [user.id]
    );

    const courses = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl || '/default-course.jpg',
      progress: Math.round(Number(row.progress || 0)),
    }));

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('My courses error:', error);
    return NextResponse.json(
      { message: 'Failed to load my courses', error: error.message },
      { status: 500 }
    );
  }
}
