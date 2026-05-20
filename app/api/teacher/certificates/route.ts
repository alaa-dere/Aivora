import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type CertificateRow = RowDataPacket & {
  id: string;
  certificateNo: string;
  issuedAt: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<CertificateRow[]>(
      `
      SELECT
        cert.id,
        cert.certificateNo,
        cert.issuedAt,
        s.id AS studentId,
        s.fullName AS studentName,
        s.email AS studentEmail,
        c.id AS courseId,
        c.title AS courseTitle
      FROM certificate cert
      JOIN course c ON c.id = cert.courseId
      JOIN user s ON s.id = cert.studentId
      WHERE c.teacherId = ?
      ORDER BY cert.issuedAt DESC
      LIMIT 500
      `,
      [user.id]
    );

    return NextResponse.json({
      certificates: rows.map((row) => ({
        id: row.id,
        certificateNo: row.certificateNo,
        issuedAt: row.issuedAt,
        student: {
          id: row.studentId,
          name: row.studentName,
          email: row.studentEmail,
        },
        course: {
          id: row.courseId,
          title: row.courseTitle,
        },
      })),
    });
  } catch (error: unknown) {
    console.error('Teacher certificates error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load certificates',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
