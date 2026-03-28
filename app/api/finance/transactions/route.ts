import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type TransactionRow = RowDataPacket & {
  id: string;
  date: string;
  dateTime: string;
  type: 'enrollment' | 'refund';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  teacherShare: number | null;
  platformShare: number | null;
  method: 'wallet' | 'card' | 'cash' | 'paypal' | null;
  studentName: string | null;
  teacherName: string | null;
  courseTitle: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '';
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';

    const conditions: string[] = [];
    const params: Array<string> = [];

    if (month) {
      conditions.push("DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?");
      params.push(month);
    }

    if (status !== 'all') {
      conditions.push('ft.status = ?');
      params.push(status);
    }

    if (type !== 'all') {
      conditions.push('ft.type = ?');
      params.push(type);
    }

    if (q.trim()) {
      const like = `%${q.trim()}%`;
      conditions.push(
        `(ft.id LIKE ? OR s.fullName LIKE ? OR t.fullName LIKE ? OR c.title LIKE ? OR ft.type LIKE ? OR ft.status LIKE ?)`
      );
      params.push(like, like, like, like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<TransactionRow[]>(
      `
        SELECT
          ft.id,
          DATE_FORMAT(ft.transactionDate, '%Y-%m-%d') AS date,
          DATE_FORMAT(ft.transactionDate, '%Y-%m-%d %H:%i') AS dateTime,
          ft.type,
          ft.status,
          ft.amount,
          ft.teacherShare,
          ft.platformShare,
          ft.method,
          s.fullName AS studentName,
          t.fullName AS teacherName,
          c.title AS courseTitle
        FROM finance_transaction ft
        LEFT JOIN user s ON s.id = ft.studentId
        LEFT JOIN user t ON t.id = ft.teacherId
        LEFT JOIN course c ON c.id = ft.courseId
        ${whereSql}
        ORDER BY ft.transactionDate DESC
        LIMIT 500
      `,
      params
    );

    return NextResponse.json({ transactions: rows });
  } catch (error: any) {
    console.error('Finance transactions error:', error);
    return NextResponse.json(
      { message: 'Failed to load transactions', error: error.message },
      { status: 500 }
    );
  }
}
