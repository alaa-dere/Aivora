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

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, status
      FROM course
      WHERE teacherId = ?
      `,
      [teacherId]
    );

    const courseIds = courseRows.map((row) => row.id as string);
    const activeCourses = courseRows.filter((row) => row.status === 'published').length;

    let totalStudents = 0;
    let avgProgress = 0;

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const [studentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(DISTINCT studentId) AS totalStudents,
               AVG(progressPercentage) AS avgProgress
        FROM enrollment
        WHERE courseId IN (${placeholders})
        `,
        courseIds
      );
      totalStudents = Number(studentRows[0]?.totalStudents || 0);
      avgProgress = Number(studentRows[0]?.avgProgress || 0);
    }

    const stats = {
      totalStudents,
      activeCourses,
      avgScore: Math.round(avgProgress),
      completion: Math.round(avgProgress),
    };

    const [coursesList] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.id,
        c.title,
        c.status,
        c.description,
        (
          SELECT COUNT(*) FROM enrollment e WHERE e.courseId = c.id
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
      LIMIT 4
      `,
      [teacherId]
    );

    const courses = coursesList.map((row) => ({
      id: row.id,
      name: row.title,
      code: row.id,
      students: Number(row.students || 0),
      completion: Math.round(Number(row.progress || 0)),
      averageScore: Math.round(Number(row.progress || 0)),
      status: row.status === 'published' ? 'active' : 'draft',
      description: row.description || '',
    }));

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        u.fullName AS name,
        e.progressPercentage AS progress,
        e.status AS status
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      LIMIT 4
      `,
      [teacherId]
    );

    const students = studentRows.map((row) => ({
      name: row.name,
      avatar: (row.name || '?')
        .split(' ')
        .map((part: string) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      progress: Math.round(Number(row.progress || 0)),
      status: Number(row.progress || 0) >= 60 ? 'passed' : 'failed',
    }));

    const [activityRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        u.fullName AS studentName,
        c.title AS courseTitle,
        e.enrolledAt AS time
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      LIMIT 3
      `,
      [teacherId]
    );

    const recentActivities = activityRows.map((row) => ({
      type: 'ENROLL',
      description: `${row.studentName} enrolled in ${row.courseTitle}`,
      time: new Date(row.time).toLocaleString('en-US'),
    }));

    return NextResponse.json({
      stats,
      courses,
      students,
      recentActivities,
    });
  } catch (error: any) {
    console.error('Teacher dashboard error:', error);
    return NextResponse.json(
      { message: 'Failed to load teacher dashboard', error: error.message },
      { status: 500 }
    );
  }
}
