import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestRole } from '@/lib/request-auth';

type CertificateRow = RowDataPacket & {
  id: string;
  certificateNo: string;
  issuedAt: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
};

export async function GET(req: Request) {
  const role = await getRequestRole(req);
  if (role !== 'admin') {
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
        c.title AS courseTitle,
        t.id AS teacherId,
        t.fullName AS teacherName
      FROM certificate cert
      JOIN course c ON c.id = cert.courseId
      JOIN user s ON s.id = cert.studentId
      JOIN user t ON t.id = c.teacherId
      ORDER BY cert.issuedAt DESC
      LIMIT 500
      `
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
        teacher: {
          id: row.teacherId,
          name: row.teacherName,
        },
      })),
    });
  } catch (error: unknown) {
    console.error('Admin certificates error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load certificates',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
