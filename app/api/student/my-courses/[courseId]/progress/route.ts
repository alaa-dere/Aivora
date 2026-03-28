import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();
    const body = await req.json();
    const lessonId = String(body?.lessonId || '').trim();
    const event = String(body?.event || 'complete').trim();

    if (!lessonId) {
      return NextResponse.json({ message: 'Lesson ID required' }, { status: 400 });
    }

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [id, user.id]
    );
    if (enrollRows.length === 0) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }
    const enrollmentId = enrollRows[0].id as string;

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM lessonprogress WHERE enrollmentId = ? AND lessonId = ? LIMIT 1`,
      [enrollmentId, lessonId]
    );

    if (event === 'start') {
      if (existing.length === 0) {
        const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
        const progressId = idRows[0].id as string;
        await pool.query<ResultSetHeader>(
          `
          INSERT INTO lessonprogress
            (id, enrollmentId, lessonId, completed, progressPercentage, startedAt, completedAt)
          VALUES
            (?, ?, ?, FALSE, 0, NOW(), NULL)
          `,
          [progressId, enrollmentId, lessonId]
        );
      } else {
        await pool.query<ResultSetHeader>(
          `
          UPDATE lessonprogress
          SET startedAt = NOW()
          WHERE id = ?
          `,
          [existing[0].id]
        );
      }

      return NextResponse.json({ success: true, event: 'start' });
    }

    if (event === 'issue_certificate') {
      const [totalRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS totalLessons
        FROM lesson l
        JOIN module m ON m.id = l.moduleId
        WHERE m.courseId = ?
        `,
        [id]
      );
      const totalLessons = Number(totalRows[0]?.totalLessons || 0);

      const [completedRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS completedLessons
        FROM lessonprogress lp
        JOIN lesson l ON l.id = lp.lessonId
        JOIN module m ON m.id = l.moduleId
        WHERE m.courseId = ? AND lp.enrollmentId = ? AND lp.completed = TRUE
        `,
        [id, enrollmentId]
      );
      const completedLessons = Number(completedRows[0]?.completedLessons || 0);

      if (totalLessons === 0 || completedLessons < totalLessons) {
        return NextResponse.json(
          { message: 'Complete all lessons before receiving the certificate' },
          { status: 400 }
        );
      }

      const [certRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
        [user.id, id]
      );

      if (certRows.length === 0) {
        const [courseRows] = await pool.query<RowDataPacket[]>(
          `SELECT title FROM course WHERE id = ? LIMIT 1`,
          [id]
        );
        const courseTitle = String(courseRows[0]?.title || 'Course');
        const code = courseTitle
          .split(/\s+/)
          .map((w) => w.replace(/[^a-z0-9]/gi, '').slice(0, 1))
          .join('')
          .toUpperCase()
          .slice(0, 6) || 'AIV';

        const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
        const certId = idRows[0].id as string;
        const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const certNo = `AIV-${code}-${dateStamp}-${certId.slice(0, 6).toUpperCase()}`;

        await pool.query<ResultSetHeader>(
          `
          INSERT INTO certificate
            (id, studentId, courseId, certificateNo, issuedAt, createdAt, updatedAt)
          VALUES
            (?, ?, ?, ?, NOW(), NOW(), NOW())
          `,
          [certId, user.id, id, certNo]
        );

        return NextResponse.json({ success: true, certificateId: certId });
      }

      return NextResponse.json({ success: true, certificateId: certRows[0].id as string });
    }

    if (existing.length === 0) {
      const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const progressId = idRows[0].id as string;
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO lessonprogress
          (id, enrollmentId, lessonId, completed, progressPercentage, startedAt, completedAt)
        VALUES
          (?, ?, ?, TRUE, 100, NOW(), NOW())
        `,
        [progressId, enrollmentId, lessonId]
      );
    } else {
      await pool.query<ResultSetHeader>(
        `
        UPDATE lessonprogress
        SET completed = TRUE,
            progressPercentage = 100,
            startedAt = IFNULL(startedAt, NOW()),
            completedAt = NOW()
        WHERE id = ?
        `,
        [existing[0].id]
      );
    }

    const [totalRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS totalLessons
      FROM lesson l
      JOIN module m ON m.id = l.moduleId
      WHERE m.courseId = ?
      `,
      [id]
    );
    const totalLessons = Number(totalRows[0]?.totalLessons || 0);

    const [completedRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS completedLessons
      FROM lessonprogress lp
      JOIN lesson l ON l.id = lp.lessonId
      JOIN module m ON m.id = l.moduleId
      WHERE m.courseId = ? AND lp.enrollmentId = ? AND lp.completed = TRUE
      `,
      [id, enrollmentId]
    );
    const completedLessons = Number(completedRows[0]?.completedLessons || 0);
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    await pool.query<ResultSetHeader>(
      `
      UPDATE enrollment
      SET progressPercentage = ?, status = IF(?, 'completed', status),
          completedAt = IF(?, NOW(), completedAt)
      WHERE id = ?
      `,
      [
        progressPercentage,
        completedLessons === totalLessons && totalLessons > 0,
        completedLessons === totalLessons && totalLessons > 0,
        enrollmentId,
      ]
    );

    let needsCertificateChoice = false;
    let certificateId: string | null = null;
    if (completedLessons === totalLessons && totalLessons > 0) {
      const [certRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
        [user.id, id]
      );
      if (certRows.length > 0) {
        certificateId = certRows[0].id as string;
      } else {
        needsCertificateChoice = true;
      }
    }

    return NextResponse.json({
      success: true,
      progressPercentage,
      completedLessons,
      totalLessons,
      needsCertificateChoice,
      certificateId,
    });
  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { message: 'Failed to update progress', error: error.message },
      { status: 500 }
    );
  }
}
