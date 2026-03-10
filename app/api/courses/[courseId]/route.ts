import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = params;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        c.id, c.title, c.description, c.coverImage,
        u.fullName AS teacherName, u.id AS teacherId,
        c.price, c.teacherSharePct, c.status,
        DATE_FORMAT(c.createdAt, '%Y-%m-%d') AS createdAt,
        (SELECT COUNT(*) FROM Enrollment 
         WHERE courseId = c.id AND status = 'enrolled') AS students
       FROM Course c
       JOIN User u ON c.teacherId = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const course = {
      ...rows[0],
      price: Number(rows[0].price),
      teacherSharePct: Number(rows[0].teacherSharePct),
      students: Number(rows[0].students || 0),
    };

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = params;

  try {
    const formData = await req.formData();

    const title           = formData.get('title')       as string | null;
    const description     = formData.get('description') as string | null;
    const teacherId       = formData.get('teacherId')   as string | null;
    const priceStr        = formData.get('price');
    const shareStr        = formData.get('teacherSharePct');
    const statusRaw       = formData.get('status')      as string | null;
    const coverImageFile  = formData.get('coverImage')  as File | null;

    const updates: Record<string, any> = {};
    const values: any[] = [];

    if (title?.trim()) {
      updates.title = title.trim();
      values.push(updates.title);
    }
    if (description?.trim()) {
      updates.description = description.trim();
      values.push(updates.description);
    }
    if (teacherId) {
      updates.teacherId = teacherId;
      values.push(teacherId);
    }
    if (priceStr !== null) {
      updates.price = Number(priceStr);
      values.push(updates.price);
    }
    if (shareStr !== null) {
      updates.teacherSharePct = Number(shareStr);
      values.push(updates.teacherSharePct);
    }
    if (statusRaw) {
      const valid = ['draft', 'published', 'archived'];
      updates.status = valid.includes(statusRaw) ? statusRaw : 'draft';
      values.push(updates.status);
    }

    let coverImageUrl: string | null = null;
    if (coverImageFile && coverImageFile.size > 0) {
      coverImageUrl = `https://via.placeholder.com/1280x720?text=Updated+${Date.now()}`;
      updates.coverImage = coverImageUrl;
      values.push(coverImageUrl);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No changes provided' }, { status: 400 });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    values.push(id);

    const query = `UPDATE Course SET ${setClause}, updatedAt = NOW() WHERE id = ?`;

    const [result] = await pool.query<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course updated successfully' });
  } catch (error: any) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { message: 'Failed to update course', error: error.message, sqlMessage: error.sqlMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM Course WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to delete course', 
        error: error.message, 
        sqlMessage: error.sqlMessage || 'Database error - check foreign key constraints' 
      },
      { status: 500 }
    );
  }
}