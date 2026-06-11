import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { createAdminNotification, createTeacherNotification } from '@/lib/notifications-write';

interface Params {
  params: Promise<{ pathId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const conn = await pool.getConnection();
  try {
    const { pathId } = await params;
    const id = decodeURIComponent(pathId).trim();
    const body = await req.json().catch(() => ({}));
    const paymentConfirmed = Boolean(body?.paymentConfirmed);
    const rawMethod = typeof body?.method === 'string' ? body.method : '';
    const paymentMethod =
      rawMethod === 'card' || rawMethod === 'paypal' || rawMethod === 'wallet' || rawMethod === 'cash'
        ? rawMethod
        : 'wallet';

    const [pathRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT id, title, price
      FROM learning_path
      WHERE id = ? AND status = 'published'
      LIMIT 1
      `,
      [id]
    );

    if (pathRows.length === 0) {
      return NextResponse.json({ message: 'Learning path not available' }, { status: 404 });
    }
    const selectedPath = pathRows[0];
    const pathPrice = Number(selectedPath.price || 0);

    if (pathPrice > 0 && !paymentConfirmed) {
      return NextResponse.json(
        { message: 'Payment confirmation is required for this learning path' },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const [pathEnrollResult] = await conn.query<ResultSetHeader>(
      `
      INSERT IGNORE INTO path_enrollment
        (id, pathId, studentId, enrolledAt, status, progressPercentage)
      VALUES
        (UUID(), ?, ?, NOW(), 'enrolled', 0)
      `,
      [id, user.id]
    );

    if (Number(pathEnrollResult.affectedRows || 0) === 0) {
      await conn.rollback();
      return NextResponse.json(
        {
          success: true,
          message: 'Already enrolled in path',
          pathId: id,
        },
        { status: 200 }
      );
    }

    const [courseMapRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT lpc.courseId, c.title AS courseTitle, c.teacherId, c.teacherSharePct
      FROM learning_path_course lpc
      JOIN course c ON c.id = lpc.courseId
      WHERE lpc.pathId = ?
        AND c.status = 'published'
      ORDER BY lpc.orderNumber ASC
      `,
      [id]
    );

    const firstCourse = courseMapRows[0];
    let enrolledFirstCourseId = '';
    let enrolledFirstCourseTitle = '';
    let enrolledFirstCourseTeacherId = '';
    let firstCourseTeacherSharePct = 70;

    if (firstCourse) {
      const courseId = String(firstCourse.courseId || '').trim();
      if (courseId) {
        enrolledFirstCourseId = courseId;
        enrolledFirstCourseTitle = String(firstCourse.courseTitle || 'Course');
        enrolledFirstCourseTeacherId = String(firstCourse.teacherId || '').trim();
        firstCourseTeacherSharePct = Number(firstCourse.teacherSharePct ?? 70);

        await conn.query<ResultSetHeader>(
          `
          INSERT IGNORE INTO enrollment
            (id, studentId, courseId, enrolledAt, status, progressPercentage)
          VALUES
            (UUID(), ?, ?, NOW(), 'enrolled', 0)
          `,
          [user.id, courseId]
        );
      }
    }

    const pathTitle = String(selectedPath.title || 'Learning Path');

    if (pathPrice > 0) {
      const pct = Number.isFinite(firstCourseTeacherSharePct) ? firstCourseTeacherSharePct : 70;
      const teacherShare = Number(((pathPrice * pct) / 100).toFixed(2));
      const platformShare = Number((pathPrice - teacherShare).toFixed(2));
      const [txIdRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const txId = String(txIdRows[0]?.id || '').trim();

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO finance_transaction
          (id, transactionDate, type, status, amount, currency, studentId, teacherId, courseId, teacherShare, platformShare, method, notes, createdAt)
        VALUES
          (?, NOW(), 'enrollment', 'success', ?, 'USD', ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          txId,
          pathPrice,
          user.id,
          enrolledFirstCourseTeacherId || null,
          enrolledFirstCourseId || null,
          teacherShare,
          platformShare,
          paymentMethod,
          `Path enrollment payment: ${pathTitle}`,
        ]
      );
    }

    const [studentRows] = await conn.query<RowDataPacket[]>(
      `SELECT fullName FROM user WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const studentName = String(studentRows[0]?.fullName || 'Student');

    await conn.commit();

    await createAdminNotification({
      type: 'course_enroll',
      title: 'Student Enrolled in Path',
      message: `${studentName} enrolled in path "${pathTitle}".`,
      studentId: user.id,
      courseId: enrolledFirstCourseId || null,
    });

    if (enrolledFirstCourseId) {
      await createAdminNotification({
        type: 'course_enroll',
        title: 'Auto-Enrolled in First Path Course',
        message: `${studentName} was auto-enrolled in the first path course "${enrolledFirstCourseTitle}" from "${pathTitle}".`,
        studentId: user.id,
        courseId: enrolledFirstCourseId,
      });
    }

    if (enrolledFirstCourseTeacherId && enrolledFirstCourseId) {
      await createTeacherNotification({
        teacherId: enrolledFirstCourseTeacherId,
        studentId: user.id,
        courseId: enrolledFirstCourseId,
        type: 'course_enroll',
        title: 'New Path Student Enrollment',
        message: `${studentName} was auto-enrolled in your course "${enrolledFirstCourseTitle}" through path "${pathTitle}".`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Enrolled in path successfully',
        pathId: id,
        firstCourseEnrolled: enrolledFirstCourseId || null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    await conn.rollback();
    console.error('Path enrollment error:', error);
    return NextResponse.json(
      {
        message: 'Failed to enroll in path',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
