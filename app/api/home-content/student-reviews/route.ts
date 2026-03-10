import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, language, studentName, reviewText, courseTitle, rating, sortOrder, isActive
       FROM HomeStudentReview
       ORDER BY sortOrder ASC, createdAt DESC`
    );

    return NextResponse.json({
      items: rows.map((item) => ({
        ...item,
        rating: Number(item.rating),
        sortOrder: Number(item.sortOrder || 0),
        isActive: Boolean(item.isActive),
      })),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to fetch student reviews', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = crypto.randomUUID();

    const payload = {
      language: body.language === 'ar' ? 'ar' : 'en',
      studentName: String(body.studentName || '').trim(),
      reviewText: String(body.reviewText || '').trim(),
      courseTitle: String(body.courseTitle || '').trim(),
      rating: Number(body.rating || 5),
      sortOrder: Number(body.sortOrder || 0),
      isActive: body.isActive === false ? 0 : 1,
    };

    if (!payload.studentName || !payload.reviewText) {
      return NextResponse.json(
        { message: 'studentName and reviewText are required' },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO HomeStudentReview
       (id, language, studentName, reviewText, courseTitle, rating, sortOrder, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.language,
        payload.studentName,
        payload.reviewText,
        payload.courseTitle,
        payload.rating,
        payload.sortOrder,
        payload.isActive,
      ]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to create student review', error: errorMessage },
      { status: 500 }
    );
  }
}
