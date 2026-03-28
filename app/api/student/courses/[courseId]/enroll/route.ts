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
    const body = await req.json().catch(() => ({}));
    const paymentConfirmed = Boolean(body?.paymentConfirmed);
    const fullName =
      typeof body?.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const country =
      typeof body?.country === 'string' ? body.country.trim() : null;
    const rawCardLast4 =
      typeof body?.cardLast4 === 'string' ? body.cardLast4 : '';
    const cardLast4 = rawCardLast4.replace(/\D/g, '').slice(-4) || null;
    const paypalEmail =
      typeof body?.paypalEmail === 'string' ? body.paypalEmail.trim() : '';
    const paypalTxnId =
      typeof body?.paypalTxnId === 'string' ? body.paypalTxnId.trim() : '';
    const rawMethod = typeof body?.method === 'string' ? body.method : '';
    const paymentMethod = rawMethod === 'paypal' ? 'paypal' : 'card';

    if (!paymentConfirmed) {
      return NextResponse.json({ message: 'Payment required' }, { status: 400 });
    }
    if (!fullName || !email) {
      return NextResponse.json({ message: 'Missing payment details' }, { status: 400 });
    }
    if (paymentMethod === 'card' && !cardLast4) {
      return NextResponse.json({ message: 'Card details required' }, { status: 400 });
    }
    if (paymentMethod === 'paypal' && (!paypalEmail || !paypalTxnId)) {
      return NextResponse.json({ message: 'PayPal details required' }, { status: 400 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, teacherId, price, teacherSharePct
      FROM course
      WHERE id = ? AND status = 'published'
      LIMIT 1
      `,
      [id]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not available' }, { status: 404 });
    }

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [id, user.id]
    );

    if (existingRows.length > 0) {
      const existingEnrollmentId = existingRows[0].id as string;
      const [paymentIdRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const paymentId = paymentIdRows[0].id as string;
      await pool.query<ResultSetHeader>(
        `
        INSERT IGNORE INTO enrollment_payment
          (id, enrollmentId, studentId, courseId, fullName, email, country, cardLast4, paypalEmail, paypalTxnId, method, createdAt)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          paymentId,
          existingEnrollmentId,
          user.id,
          id,
          fullName,
          email,
          country,
          cardLast4,
          paypalEmail || null,
          paypalTxnId || null,
          paymentMethod,
        ]
      );
      return NextResponse.json({ success: true, enrollmentId: existingEnrollmentId });
    }

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const enrollmentId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO enrollment
        (id, studentId, courseId, enrolledAt, status, progressPercentage)
      VALUES
        (?, ?, ?, NOW(), 'enrolled', 0)
      `,
      [enrollmentId, user.id, id]
    );

    const course = courseRows[0];
    const price = Number(course.price || 0);
    const pct = Number(course.teacherSharePct ?? 70);
    const teacherShare = Number(((price * pct) / 100).toFixed(2));
    const platformShare = Number((price - teacherShare).toFixed(2));
    const method = ['wallet', 'card', 'cash', 'paypal'].includes(rawMethod)
      ? rawMethod
      : paymentMethod;

    const [txIdRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const txId = txIdRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO finance_transaction
        (id, transactionDate, type, status, amount, currency, studentId, teacherId, courseId, teacherShare, platformShare, method, notes, createdAt)
      VALUES
        (?, NOW(), 'enrollment', 'success', ?, 'USD', ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        txId,
        price,
        user.id,
        course.teacherId,
        id,
        teacherShare,
        platformShare,
        method,
        'Enrollment payment',
      ]
    );

    const [paymentIdRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const paymentId = paymentIdRows[0].id as string;
    await pool.query<ResultSetHeader>(
      `
      INSERT INTO enrollment_payment
        (id, enrollmentId, studentId, courseId, fullName, email, country, cardLast4, paypalEmail, paypalTxnId, method, createdAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        paymentId,
        enrollmentId,
        user.id,
        id,
        fullName,
        email,
        country,
        cardLast4,
        paypalEmail || null,
        paypalTxnId || null,
        paymentMethod,
      ]
    );

    const [notifIdRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const notifId = notifIdRows[0].id as string;
    await pool.query(
      `
      INSERT INTO admin_notification
        (id, type, title, message, studentId, courseId, createdAt)
      VALUES
        (?, 'course_enroll', 'New Enrollment', ?, ?, ?, NOW())
      `,
      [
        notifId,
        `Student enrolled in course ${id}.`,
        user.id,
        id,
      ]
    );


    return NextResponse.json({ success: true, enrollmentId }, { status: 201 });
  } catch (error: any) {
    console.error('Enroll error:', error);
    return NextResponse.json(
      { message: 'Failed to enroll', error: error.message },
      { status: 500 }
    );
  }
}
