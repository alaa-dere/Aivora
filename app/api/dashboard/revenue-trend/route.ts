import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type TrendRow = RowDataPacket & {
  week: string;
  revenue: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = String(searchParams.get('month') || '').trim();
    const validMonth = /^\d{4}-\d{2}$/.test(month);

    const now = new Date();
    let anchorDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    if (validMonth) {
      const [yearStr, monthStr] = month.split('-');
      const y = Number(yearStr);
      const m = Number(monthStr);
      if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
        const endOfMonth = new Date(y, m, 0);
        anchorDate = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
      }
    }

    const [rows] = await pool.query<TrendRow[]>(
      `
      WITH RECURSIVE weeks AS (
        SELECT DATE_SUB(DATE_SUB(?, INTERVAL WEEKDAY(?) DAY), INTERVAL 11 WEEK) AS week_start
        UNION ALL
        SELECT DATE_ADD(week_start, INTERVAL 1 WEEK)
        FROM weeks
        WHERE week_start < DATE_SUB(?, INTERVAL WEEKDAY(?) DAY)
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
      ,
      [anchorDate, anchorDate, anchorDate, anchorDate]
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
