import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { OkPacket } from 'mysql2';

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();

    const payload = {
      language: body.language === 'ar' ? 'ar' : 'en',
      studentName: String(body.studentName || '').trim(),
      reviewText: String(body.reviewText || '').trim(),
      courseTitle: String(body.courseTitle || '').trim(),
      rating: Number(body.rating || 5),
      sortOrder: Number(body.sortOrder || 0),
      isActive: body.isActive === false ? 0 : 1,
    };

    const [result] = await db.query<OkPacket>(
      `UPDATE HomeStudentReview
       SET language = ?, studentName = ?, reviewText = ?, courseTitle = ?,
           rating = ?, sortOrder = ?, isActive = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        payload.language,
        payload.studentName,
        payload.reviewText,
        payload.courseTitle,
        payload.rating,
        payload.sortOrder,
        payload.isActive,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student review updated' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to update student review', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const [result] = await db.query<OkPacket>('DELETE FROM HomeStudentReview WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student review deleted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to delete student review', error: errorMessage },
      { status: 500 }
    );
  }
}
