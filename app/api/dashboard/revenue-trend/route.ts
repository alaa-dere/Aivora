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
      WITH RECURSIVE weeks AS (
        SELECT DATE_SUB(CURDATE(), INTERVAL 11 WEEK) AS week_start
        UNION ALL
        SELECT DATE_ADD(week_start, INTERVAL 1 WEEK)
        FROM weeks
        WHERE week_start < CURDATE()
      )
      SELECT
        DATE_FORMAT(weeks.week_start, '%Y-%u') AS weekKey,
        CONCAT('W', DATE_FORMAT(weeks.week_start, '%u')) AS week,
        COALESCE(SUM(ft.amount), 0) AS revenue
      FROM weeks
      LEFT JOIN finance_transaction ft
        ON YEARWEEK(ft.transactionDate, 3) = YEARWEEK(weeks.week_start, 3)
        AND ft.status = 'success'
        AND ft.type = 'enrollment'
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
