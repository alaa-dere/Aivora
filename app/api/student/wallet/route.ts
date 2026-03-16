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
      SELECT COALESCE(SUM(c.price), 0) AS totalSpent
      FROM Enrollment e
      JOIN Course c ON c.id = e.courseId
      WHERE e.studentId = ?
      `,
      [user.id]
    );

    const totalSpent = Number(rows[0]?.totalSpent || 0);

    return NextResponse.json({
      balance: 0,
      totalSpent,
      payments: [],
    });
  } catch (error: any) {
    console.error('Student wallet error:', error);
    return NextResponse.json(
      { message: 'Failed to load wallet', error: error.message },
      { status: 500 }
    );
  }
}
