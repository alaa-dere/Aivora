import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type PayoutRow = RowDataPacket & {
  id: string;
  date: string;
  teacherName: string | null;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  method: 'wallet' | 'card' | 'cash' | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '';
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';

    const conditions: string[] = [];
    const params: Array<string> = [];

    if (month) {
      conditions.push("DATE_FORMAT(fp.payoutDate, '%Y-%m') = ?");
      params.push(month);
    }

    if (status !== 'all') {
      conditions.push('fp.status = ?');
      params.push(status);
    }

    if (q.trim()) {
      const like = `%${q.trim()}%`;
      conditions.push(`(fp.id LIKE ? OR t.fullName LIKE ? OR fp.method LIKE ? OR fp.status LIKE ?)`);
      params.push(like, like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<PayoutRow[]>(
      `
        SELECT
          fp.id,
          DATE_FORMAT(fp.payoutDate, '%Y-%m-%d') AS date,
          t.fullName AS teacherName,
          fp.status,
          fp.amount,
          fp.method
        FROM finance_payout fp
        LEFT JOIN user t ON t.id = fp.teacherId
        ${whereSql}
        ORDER BY fp.payoutDate DESC
        LIMIT 500
      `,
      params
    );

    return NextResponse.json({ payouts: rows });
  } catch (error: any) {
    console.error('Finance payouts error:', error);
    return NextResponse.json(
      { message: 'Failed to load payouts', error: error.message },
      { status: 500 }
    );
  }
}
