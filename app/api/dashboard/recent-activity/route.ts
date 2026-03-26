import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type ActivityRow = RowDataPacket & {
  studentName: string;
  courseTitle: string;
  enrolledAt: string;
};

export async function GET() {
  try {
    const [rows] = await pool.query<ActivityRow[]>(
      `
      SELECT
        u.fullName AS studentName,
        c.title AS courseTitle,
        e.enrolledAt
      FROM enrollment e
      JOIN user u ON u.id = e.studentId
      JOIN course c ON c.id = e.courseId
      ORDER BY e.enrolledAt DESC
      LIMIT 6
      `
    );

    const activities = rows.map((row) => ({
      type: 'ENROLL',
      description: `${row.studentName} enrolled in ${row.courseTitle}`,
      time: row.enrolledAt,
    }));

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { message: 'Failed to load recent activity', error: error.message },
      { status: 500 }
    );
  }
}
