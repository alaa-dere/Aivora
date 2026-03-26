import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type TrendRow = RowDataPacket & {
  week: string;
  revenue: number;
};

export async function GET() {
  try {
    const [rows] = await pool.query<TrendRow[]>(
      `
      SELECT
        DATE_FORMAT(ft.transactionDate, '%Y-%u') AS weekKey,
        CONCAT('W', DATE_FORMAT(ft.transactionDate, '%u')) AS week,
        COALESCE(SUM(ft.amount), 0) AS revenue
      FROM finance_transaction ft
      WHERE ft.status = 'success'
        AND ft.type = 'enrollment'
        AND ft.transactionDate >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      GROUP BY weekKey, week
      ORDER BY weekKey ASC
      `
    );

    return NextResponse.json({ trend: rows });
  } catch (error: any) {
    console.error('Revenue trend error:', error);
    return NextResponse.json(
      { message: 'Failed to load revenue trend', error: error.message },
      { status: 500 }
    );
  }
}
