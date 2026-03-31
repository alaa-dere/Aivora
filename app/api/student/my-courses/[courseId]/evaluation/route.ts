import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { randomUUID } from 'crypto';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseEvaluationSchema } from '@/lib/ensure-course-evaluation-schema';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseEvaluationSchema();

    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();

    const [certRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
      [user.id, id]
    );
    const canEvaluate = certRows.length > 0;

    if (!canEvaluate) {
      return NextResponse.json({
        canEvaluate: false,
        hasResponse: false,
        evaluation: null,
      });
    }

    const [evalRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, rating, feedback, skippedAt, updatedAt
      FROM course_evaluation
      WHERE courseId = ? AND studentId = ?
      LIMIT 1
      `,
      [id, user.id]
    );

    const evaluation = evalRows[0] || null;

    return NextResponse.json({
      canEvaluate: true,
      hasResponse: Boolean(evaluation),
      evaluation: evaluation
        ? {
            id: String(evaluation.id),
            rating:
              evaluation.rating === null || evaluation.rating === undefined
                ? null
                : Number(evaluation.rating),
            feedback: String(evaluation.feedback || ''),
            skipped: Boolean(evaluation.skippedAt),
            updatedAt: evaluation.updatedAt,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('Student evaluation GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load evaluation status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseEvaluationSchema();

    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();

    const [certRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
      [user.id, id]
    );
    if (certRows.length === 0) {
      return NextResponse.json(
        { message: 'Certificate is required before evaluating this course' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = String(body?.action || 'submit').trim().toLowerCase();

    if (action === 'skip') {
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO course_evaluation
          (id, courseId, studentId, rating, feedback, skippedAt, createdAt, updatedAt)
        VALUES
          (?, ?, ?, NULL, NULL, NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          rating = NULL,
          feedback = NULL,
          skippedAt = NOW(),
          updatedAt = NOW()
        `,
        [randomUUID(), id, user.id]
      );

      return NextResponse.json({ success: true, skipped: true });
    }

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Please choose a star rating between 1 and 5' },
        { status: 400 }
      );
    }

    const feedbackRaw = String(body?.feedback || '');
    const feedback = feedbackRaw.trim().slice(0, 1200);

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO course_evaluation
        (id, courseId, studentId, rating, feedback, skippedAt, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, NULL, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        feedback = VALUES(feedback),
        skippedAt = NULL,
        updatedAt = NOW()
      `,
      [randomUUID(), id, user.id, rating, feedback || null]
    );

    const [metaRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        u.fullName AS studentName,
        c.title AS courseTitle
      FROM user u
      JOIN course c ON c.id = ?
      WHERE u.id = ?
      LIMIT 1
      `,
      [id, user.id]
    );
    const studentName = String(metaRows[0]?.studentName || 'Student');
    const courseTitle = String(metaRows[0]?.courseTitle || 'Course');
    const feedbackPreview = feedback ? ` Feedback: "${feedback.slice(0, 180)}"` : '';

    try {
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO admin_notification
          (id, type, title, message, studentId, courseId, createdAt)
        VALUES
          (?, 'course_enroll', ?, ?, ?, ?, NOW())
        `,
        [
          randomUUID(),
          'New course evaluation',
          `${studentName} rated "${courseTitle}" ${rating}/5.${feedbackPreview}`,
          user.id,
          id,
        ]
      );
    } catch (notifyErr) {
      console.warn('Admin evaluation notification skipped:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      skipped: false,
      evaluation: {
        rating,
        feedback,
      },
    });
  } catch (error: unknown) {
    console.error('Student evaluation POST error:', error);
    return NextResponse.json(
      {
        message: 'Failed to save evaluation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
