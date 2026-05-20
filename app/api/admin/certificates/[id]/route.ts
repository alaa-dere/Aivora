import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestRole } from '@/lib/request-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const role = await getRequestRole(req);
  if (role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const certId = decodeURIComponent(id).trim();

    const [rows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          cert.id,
          cert.certificateNo,
          cert.issuedAt,
          c.title AS courseTitle,
          s.fullName AS studentName
        FROM certificate cert
        JOIN course c ON c.id = cert.courseId
        JOIN user s ON s.id = cert.studentId
        WHERE cert.id = ?
        LIMIT 1
      `,
      [certId]
    );

    const cert = rows[0];
    if (!cert) {
      return NextResponse.json({ message: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      certificate: {
        id: cert.id,
        courseTitle: cert.courseTitle,
        studentName: cert.studentName,
        issuedAt: cert.issuedAt,
        certificateNo: cert.certificateNo,
      },
    });
  } catch (error) {
    console.error('Admin certificate load error:', error);
    return NextResponse.json({ message: 'Failed to load certificate' }, { status: 500 });
  }
}
