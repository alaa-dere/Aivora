import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.imageUrl,
        c.durationWeeks,
        c.price,
        u.fullName AS teacherName,
        c.status,
        EXISTS(
          SELECT 1 FROM enrollment e 
          WHERE e.courseId = c.id AND e.studentId = ?
        ) AS enrolled,
        EXISTS(
          SELECT 1
          FROM path_enrollment pe
          JOIN learning_path_course lpc ON lpc.pathId = pe.pathId
          JOIN learning_path lp ON lp.id = pe.pathId
          WHERE pe.studentId = ?
            AND lpc.courseId = c.id
            AND pe.status IN ('enrolled', 'in_progress')
            AND lp.status = 'published'
        ) AS paidViaPath
      FROM course c
      JOIN user u ON u.id = c.teacherId
      WHERE c.id = ?
      LIMIT 1
      `,
      [user.id, user.id, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const row = rows[0];
    let pathLocked = false;
    let lockedByCourseTitle: string | null = null;
    let lockedPathTitle: string | null = null;

    if (Boolean(row.paidViaPath) && !Boolean(row.enrolled)) {
      const [sequenceRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          lp.title AS pathTitle,
          prev.courseId AS previousCourseId,
          cprev.title AS previousCourseTitle,
          eprev.status AS previousStatus,
          eprev.progressPercentage AS previousProgress
        FROM path_enrollment pe
        JOIN learning_path lp ON lp.id = pe.pathId
        JOIN learning_path_course currentCourse
          ON currentCourse.pathId = pe.pathId
         AND currentCourse.courseId = ?
        LEFT JOIN learning_path_course prev
          ON prev.pathId = pe.pathId
         AND prev.orderNumber = currentCourse.orderNumber - 1
        LEFT JOIN course cprev ON cprev.id = prev.courseId
        LEFT JOIN enrollment eprev
          ON eprev.courseId = prev.courseId
         AND eprev.studentId = pe.studentId
        WHERE pe.studentId = ?
          AND pe.status IN ('enrolled', 'in_progress')
          AND lp.status = 'published'
        LIMIT 1
        `,
        [id, user.id]
      );

      if (sequenceRows.length > 0) {
        const prevId = String(sequenceRows[0].previousCourseId || '').trim();
        const prevStatus = String(sequenceRows[0].previousStatus || '').toLowerCase();
        const prevProgress = Number(sequenceRows[0].previousProgress || 0);
        const prevCompleted = prevStatus === 'completed' || prevProgress >= 100;

        if (prevId && !prevCompleted) {
          pathLocked = true;
          lockedByCourseTitle = String(sequenceRows[0].previousCourseTitle || 'previous course');
          lockedPathTitle = String(sequenceRows[0].pathTitle || 'this path');
        }
      }
    }

    const course = {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl || '/default-course.jpg',
      durationWeeks: Number(row.durationWeeks || 0),
      price: Number(row.price || 0),
      teacherName: row.teacherName || 'Unknown',
      status: row.status,
      enrolled: Boolean(row.enrolled),
      paidViaPath: Boolean(row.paidViaPath),
      pathLocked,
      lockedByCourseTitle,
      lockedPathTitle,
    };

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Student course detail error:', error);
    return NextResponse.json(
      { message: 'Failed to load course', error: error.message },
      { status: 500 }
    );
  }
}
