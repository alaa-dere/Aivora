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
      `SELECT courseId FROM favorite_course WHERE studentId = ?`,
      [user.id]
    );
    const ids = rows.map((row) => String(row.courseId));
    return NextResponse.json({ ids });
  } catch (error: unknown) {
    console.error('Favorite ids error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
