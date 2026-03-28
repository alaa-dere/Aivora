import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
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
          u.fullName AS studentName
        FROM certificate cert
        JOIN course c ON c.id = cert.courseId
        JOIN user u ON u.id = cert.studentId
        WHERE cert.id = ? AND cert.studentId = ?
        LIMIT 1
      `,
      [certId, user.id]
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
    console.error('Certificate load error:', error);
    return NextResponse.json({ message: 'Failed to load certificate' }, { status: 500 });
  }
}
