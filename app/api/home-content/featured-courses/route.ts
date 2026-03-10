import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, titleEn, titleAr, instructorEn, instructorAr, durationEn, durationAr,
              studentsTextEn, studentsTextAr, imageUrl, courseLink, price, rating, sortOrder, isActive
       FROM HomeFeaturedCourse
       ORDER BY sortOrder ASC, createdAt DESC`
    );

    return NextResponse.json({
      items: rows.map((item) => ({
        ...item,
        price: Number(item.price),
        rating: Number(item.rating),
        sortOrder: Number(item.sortOrder || 0),
        isActive: Boolean(item.isActive),
      })),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to fetch featured courses', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = crypto.randomUUID();

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

    if (!payload.titleEn || !payload.titleAr || !payload.imageUrl) {
      return NextResponse.json(
        { message: 'titleEn, titleAr, and imageUrl are required' },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO HomeFeaturedCourse (
        id, titleEn, titleAr, instructorEn, instructorAr, durationEn, durationAr,
        studentsTextEn, studentsTextAr, imageUrl, courseLink, price, rating, sortOrder, isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
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
      ]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to create featured course', error: errorMessage },
      { status: 500 }
    );
  }
}
