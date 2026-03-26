import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type SumRow = RowDataPacket & { total: number };
type CountRow = RowDataPacket & { count: number; type: string };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '';

    const params: Array<string> = [];
    const monthFilter = month ? "AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?" : '';
    if (month) {
      params.push(month);
    }

    const [incomeRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.amount), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.amount > 0
          ${monthFilter}
      `,
      params
    );

    const [teacherRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.teacherShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
      `,
      params
    );

    const [platformRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.platformShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
      `,
      params
    );

    const [payoutRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(fp.amount), 0) AS total
        FROM finance_payout fp
        WHERE fp.status = 'success'
          ${month ? "AND DATE_FORMAT(fp.payoutDate, '%Y-%m') = ?" : ''}
      `,
      month ? [month] : []
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT ft.type, COUNT(*) AS count
        FROM finance_transaction ft
        WHERE 1=1
          ${monthFilter}
        GROUP BY ft.type
      `,
      params
    );

    const [totalRows] = await pool.query<SumRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM finance_transaction ft
        WHERE 1=1
          ${monthFilter}
      `,
      params
    );

    const byType: Record<string, number> = {};
    for (const row of countRows) {
      byType[row.type] = Number(row.count || 0);
    }

    return NextResponse.json({
      income: Number(incomeRows[0]?.total || 0),
      teacherProfit: Number(teacherRows[0]?.total || 0),
      platformProfit: Number(platformRows[0]?.total || 0),
      payouts: Number(payoutRows[0]?.total || 0),
      byType,
      count: Number(totalRows[0]?.total || 0),
    });
  } catch (error: any) {
    console.error('Finance reports error:', error);
    return NextResponse.json(
      { message: 'Failed to load reports', error: error.message },
      { status: 500 }
    );
  }
}
