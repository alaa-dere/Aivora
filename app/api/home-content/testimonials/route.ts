import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, language, fullName, roleTitle, content, avatarUrl, rating, sortOrder, isActive
       FROM HomeTestimonial
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
      { message: 'Failed to fetch testimonials', error: errorMessage },
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
      fullName: String(body.fullName || '').trim(),
      roleTitle: String(body.roleTitle || '').trim(),
      content: String(body.content || '').trim(),
      avatarUrl: String(body.avatarUrl || '').trim(),
      rating: Number(body.rating || 5),
      sortOrder: Number(body.sortOrder || 0),
      isActive: body.isActive === false ? 0 : 1,
    };

    if (!payload.fullName || !payload.roleTitle || !payload.content) {
      return NextResponse.json(
        { message: 'fullName, roleTitle, and content are required' },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO HomeTestimonial
       (id, language, fullName, roleTitle, content, avatarUrl, rating, sortOrder, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.language,
        payload.fullName,
        payload.roleTitle,
        payload.content,
        payload.avatarUrl,
        payload.rating,
        payload.sortOrder,
        payload.isActive,
      ]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to create testimonial', error: errorMessage },
      { status: 500 }
    );
  }
}
