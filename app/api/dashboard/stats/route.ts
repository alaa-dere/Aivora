import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type CountRow = RowDataPacket & {
  total: number;
};

type RevenueRow = RowDataPacket & {
  totalRevenue: number;
};

export async function GET() {
  try {
    const [studentsRows] = await db.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM user u
       JOIN role r ON r.id = u.roleId
       WHERE r.name = 'student'`
    );

    const [teachersRows] = await db.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM user u
       JOIN role r ON r.id = u.roleId
       WHERE r.name = 'teacher'`
    );

    const [coursesRows] = await db.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM course
       WHERE status = 'published'`
    );

    const [revenueRows] = await db.query<RevenueRow[]>(
      `SELECT COALESCE(SUM(c.price), 0) AS totalRevenue
       FROM enrollment e
       JOIN course c ON c.id = e.courseId
       WHERE e.status IN ('enrolled', 'in_progress', 'completed')
         AND MONTH(e.enrolledAt) = MONTH(CURRENT_DATE())
         AND YEAR(e.enrolledAt) = YEAR(CURRENT_DATE())`
    );

    const totalStudents = Number(studentsRows[0]?.total || 0);
    const totalTeachers = Number(teachersRows[0]?.total || 0);
    const activeCourses = Number(coursesRows[0]?.total || 0);
    const monthlyRevenue = Number(revenueRows[0]?.totalRevenue || 0);

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      activeCourses,
      monthlyRevenue,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard stats', error: errorMessage },
      { status: 500 }
    );
  }
}
