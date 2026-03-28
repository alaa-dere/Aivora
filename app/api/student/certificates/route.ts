import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [readyRows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          cert.id,
          cert.certificateNo,
          cert.issuedAt,
          c.title AS courseTitle
        FROM certificate cert
        JOIN course c ON c.id = cert.courseId
        WHERE cert.studentId = ?
        ORDER BY cert.issuedAt DESC
      `,
      [user.id]
    );

    const [lockedRows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          e.courseId,
          c.title AS courseTitle,
          e.progressPercentage AS progress
        FROM enrollment e
        JOIN course c ON c.id = e.courseId
        WHERE e.studentId = ? AND (e.status != 'completed' OR e.progressPercentage < 100)
        ORDER BY e.enrolledAt DESC
      `,
      [user.id]
    );

    const ready = readyRows.map((row) => ({
      id: row.id,
      courseTitle: row.courseTitle,
      issuedAt: row.issuedAt,
      certificateNo: row.certificateNo,
      status: 'ready' as const,
    }));

    const locked = lockedRows.map((row) => ({
      id: row.courseId,
      courseTitle: row.courseTitle,
      issuedAt: '-',
      status: 'locked' as const,
      progress: Number(row.progress || 0),
    }));

    return NextResponse.json({ ready, locked });
  } catch (error) {
    console.error('Certificates list error:', error);
    return NextResponse.json({ message: 'Failed to load certificates' }, { status: 500 });
  }
}
