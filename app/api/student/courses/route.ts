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
        c.durationWeeks,
        c.price,
        u.fullName AS teacherName,
        c.status,
        EXISTS(
          SELECT 1 FROM enrollment e 
          WHERE e.courseId = c.id AND e.studentId = ?
        ) AS enrolled
      FROM course c
      JOIN user u ON u.id = c.teacherId
      WHERE c.status = 'published'
      ORDER BY c.createdAt DESC
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
      teacherName: row.teacherName || 'Unknown',
      status: row.status,
      enrolled: Boolean(row.enrolled),
    }));

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('Student courses error:', error);
    return NextResponse.json(
      { message: 'Failed to load courses', error: error.message },
      { status: 500 }
    );
  }
}
