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
      titleEn: String(body.titleEn || '').trim(),
      titleAr: String(body.titleAr || '').trim(),
      instructorEn: String(body.instructorEn || '').trim(),
      instructorAr: String(body.instructorAr || '').trim(),
      durationEn: String(body.durationEn || '').trim(),
      durationAr: String(body.durationAr || '').trim(),
      studentsTextEn: String(body.studentsTextEn || '').trim(),
      studentsTextAr: String(body.studentsTextAr || '').trim(),
      imageUrl: String(body.imageUrl || '').trim(),
      courseLink: String(body.courseLink || '#').trim(),
      price: Number(body.price || 0),
      rating: Number(body.rating || 5),
      sortOrder: Number(body.sortOrder || 0),
      isActive: body.isActive === false ? 0 : 1,
    };

    const [result] = await db.query<OkPacket>(
      `UPDATE HomeFeaturedCourse
       SET titleEn = ?, titleAr = ?, instructorEn = ?, instructorAr = ?, durationEn = ?, durationAr = ?,
           studentsTextEn = ?, studentsTextAr = ?, imageUrl = ?, courseLink = ?, price = ?, rating = ?,
           sortOrder = ?, isActive = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        payload.titleEn,
        payload.titleAr,
        payload.instructorEn,
        payload.instructorAr,
        payload.durationEn,
        payload.durationAr,
        payload.studentsTextEn,
        payload.studentsTextAr,
        payload.imageUrl,
        payload.courseLink,
        payload.price,
        payload.rating,
        payload.sortOrder,
        payload.isActive,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Featured course updated' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to update featured course', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const [result] = await db.query<OkPacket>('DELETE FROM HomeFeaturedCourse WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Featured course deleted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to delete featured course', error: errorMessage },
      { status: 500 }
    );
  }
}
