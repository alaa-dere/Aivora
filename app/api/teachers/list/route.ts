import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.fullName, u.imageUrl
       FROM user u
       JOIN role r ON u.roleId = r.id
       WHERE r.name = 'teacher' AND u.status = 'active'
       ORDER BY u.fullName`
    );

    return NextResponse.json({ teachers: rows });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ message: 'Failed to fetch teachers' }, { status: 500 });
  }
}
