import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type SummaryRow = RowDataPacket & {
  totalRevenue: number;
  monthRevenue: number;
  grossSales: number;
};

type TxRow = RowDataPacket & {
  id: string;
  transactionDate: string;
  type: 'enrollment' | 'refund';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency?: string | null;
  teacherShare: number;
  studentName?: string | null;
  courseTitle?: string | null;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const teacherId = user.id;

    const [summaryRows] = await pool.query<SummaryRow[]>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN ft.status = 'success' THEN ft.teacherShare ELSE 0 END), 0) AS totalRevenue,
        COALESCE(SUM(CASE WHEN ft.status = 'success' AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN ft.teacherShare ELSE 0 END), 0) AS monthRevenue,
        COALESCE(SUM(CASE WHEN ft.status = 'success' THEN ft.amount ELSE 0 END), 0) AS grossSales
      FROM finance_transaction ft
      WHERE ft.teacherId = ?
      `,
      [teacherId]
    );

    const [txRows] = await pool.query<TxRow[]>(
      `
      SELECT
        ft.id,
        ft.transactionDate,
        ft.type,
        ft.status,
        ft.amount,
        ft.currency,
        ft.teacherShare,
        s.fullName AS studentName,
        c.title AS courseTitle
      FROM finance_transaction ft
      LEFT JOIN user s ON s.id = ft.studentId
      LEFT JOIN course c ON c.id = ft.courseId
      WHERE ft.teacherId = ?
      ORDER BY ft.transactionDate DESC
      LIMIT 50
      `,
      [teacherId]
    );

    return NextResponse.json({
      summary: {
        totalRevenue: Number(summaryRows[0]?.totalRevenue || 0),
        monthRevenue: Number(summaryRows[0]?.monthRevenue || 0),
        grossSales: Number(summaryRows[0]?.grossSales || 0),
      },
      transactions: txRows.map((row) => ({
        id: row.id,
        dateTime: row.transactionDate,
        type: row.type,
        status: row.status,
        amount: Number(row.amount || 0),
        currency: String(row.currency || 'USD'),
        teacherShare: Number(row.teacherShare || 0),
        studentName: row.studentName ? String(row.studentName) : null,
        courseTitle: row.courseTitle ? String(row.courseTitle) : null,
      })),
    });
  } catch (error: unknown) {
    console.error('Teacher earnings GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load earnings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

