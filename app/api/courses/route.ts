import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.id,
        c.title,
        LEFT(c.description, 150) AS description,
        c.coverImage,
        u.fullName AS teacherName,
        u.id AS teacherId,
        c.price,
        c.teacherSharePct,
        c.status,
        DATE_FORMAT(c.createdAt, '%Y-%m-%d') AS createdAt,
        (SELECT COUNT(*) FROM Enrollment 
         WHERE courseId = c.id AND status = 'enrolled') AS students
      FROM Course c
      JOIN User u ON c.teacherId = u.id
      ORDER BY c.createdAt DESC
    `);

    // تحويل الأنواع الرقمية لتجنب مشاكل .toFixed() في الفرونت
    const courses = rows.map(row => ({
      ...row,
      price: Number(row.price),
      teacherSharePct: Number(row.teacherSharePct),
      students: Number(row.students || 0),
    }));

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch courses', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title           = formData.get('title')       as string;
    const description     = formData.get('description') as string;
    const teacherId       = formData.get('teacherId')   as string;
    const price           = Number(formData.get('price') || 0);
    const teacherSharePct = Number(formData.get('teacherSharePct') || 70);
    const statusRaw       = formData.get('status')      as string;
    const coverImageFile  = formData.get('coverImage')  as File | null;

    if (!title?.trim() || !description?.trim() || !teacherId) {
      return NextResponse.json({ message: 'Title, description, and teacher are required' }, { status: 400 });
    }

    const validStatuses = ['draft', 'published', 'archived'];
    const finalStatus = validStatuses.includes(statusRaw) ? statusRaw : 'draft';

    // تحقق من أن teacherId هو مدرس فعلاً
    const [teacherCheck] = await pool.query<RowDataPacket[]>(
      `SELECT u.id 
       FROM User u 
       JOIN Role r ON u.roleId = r.id 
       WHERE u.id = ? AND r.name = 'teacher'`,
      [teacherId]
    );

    if (teacherCheck.length === 0) {
      return NextResponse.json({ message: 'Invalid teacher ID or not a teacher' }, { status: 400 });
    }

    let coverImageUrl: string | null = null;

    if (coverImageFile && coverImageFile.size > 0) {
      // حالياً placeholder – يمكنك استبداله بـ Cloudinary أو UploadThing لاحقاً
      coverImageUrl = `https://via.placeholder.com/1280x720?text=${encodeURIComponent(title)}`;
    }

    const [result] = await pool.query<OkPacket>(
      `INSERT INTO Course 
        (id, title, description, coverImage, teacherId, price, teacherSharePct, status, createdAt, updatedAt) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title.trim(), description.trim(), coverImageUrl, teacherId, price, teacherSharePct, finalStatus]
    );

    return NextResponse.json(
      { success: true, message: 'Course created successfully', courseId: result.insertId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { message: 'Failed to create course', error: error.message, sqlMessage: error.sqlMessage },
      { status: 500 }
    );
  }
}