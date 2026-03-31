import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const teacherId = user.id;
    const { searchParams } = new URL(req.url);
    const courseId = (searchParams.get('courseId') || '').trim();

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.status,
        c.updatedAt,
        (
          SELECT COUNT(*)
          FROM enrollment e
          WHERE e.courseId = c.id
            AND NOT EXISTS (
              SELECT 1
              FROM certificate cert
              WHERE cert.studentId = e.studentId
                AND cert.courseId = e.courseId
            )
        ) AS students,
        (
          SELECT COUNT(*) FROM module m WHERE m.courseId = c.id
        ) AS modules,
        (
          SELECT COUNT(*) 
          FROM lesson l 
          JOIN module m2 ON m2.id = l.moduleId
          WHERE m2.courseId = c.id
        ) AS lessons,
        (
          SELECT AVG(e.progressPercentage) FROM enrollment e WHERE e.courseId = c.id
        ) AS progress
      FROM course c
      WHERE c.teacherId = ?
      ORDER BY c.updatedAt DESC
      `,
      [teacherId]
    );

    const courses = rows.map((row) => ({
      id: row.id,
      name: row.title,
      code: row.id,
      students: Number(row.students || 0),
      modules: Number(row.modules || 0),
      lessons: Number(row.lessons || 0),
      progress: Math.round(Number(row.progress || 0)),
      lastUpdated: row.updatedAt,
      status: row.status === 'published' ? 'active' : 'draft',
      description: row.description || '',
    }));

    const stats = {
      totalCourses: courses.length,
      activeCourses: courses.filter((c) => c.status === 'active').length,
      totalStudents: courses.reduce((sum, c) => sum + c.students, 0),
      totalLessons: courses.reduce((sum, c) => sum + c.lessons, 0),
    };
    if (!courseId) {
      return NextResponse.json({ courses, stats, students: [] });
    }

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        u.id,
        u.fullName,
        u.email,
        u.imageUrl,
        e.progressPercentage,
        e.status,
        e.enrolledAt
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
        AND c.id = ?
        AND NOT EXISTS (
          SELECT 1
          FROM certificate cert
          WHERE cert.studentId = e.studentId
            AND cert.courseId = e.courseId
        )
      ORDER BY e.enrolledAt DESC
      `,
      [teacherId, courseId]
    );

    const students = studentRows.map((row) => ({
      id: row.id,
      name: row.fullName,
      email: row.email,
      imageUrl: row.imageUrl || null,
      progress: Math.round(Number(row.progressPercentage || 0)),
      status: row.status || 'enrolled',
      enrolledAt: row.enrolledAt,
    }));

    return NextResponse.json({ courses, stats, students });
  } catch (error: any) {
    console.error('Teacher courses error:', error);
    return NextResponse.json(
      { message: 'Failed to load teacher courses', error: error.message },
      { status: 500 }
    );
  }
}
