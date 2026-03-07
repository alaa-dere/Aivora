import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.id,
        c.title,
        LEFT(c.description, 150) AS description,
        u.fullName AS teacherName,
        u.id AS teacherId,
        c.price,
        c.teacherSharePct,
        c.status,
        DATE_FORMAT(c.createdAt, '%Y-%m-%d') AS createdAt,
        (SELECT COUNT(*) FROM Enrollment WHERE courseId = c.id AND status = 'active') AS students
      FROM Course c
      JOIN User u ON c.teacherId = u.id
      ORDER BY c.createdAt DESC
    `);

    return NextResponse.json({ courses: rows });
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
    const body = await req.json();
    console.log('📦 Received course data:', body);

    const { title, description, teacherId, price = 0, teacherSharePct = 60, status = 'draft' } = body;

    // التحقق من المدخلات
    if (!title || !description || !teacherId) {
      return NextResponse.json(
        { message: 'Title, Description, and Teacher are required' },
        { status: 400 }
      );
    }

    // تحقق من صحة status
    const validStatuses = ['draft', 'active', 'paused', 'archived', 'published'];
    const finalStatus = validStatuses.includes(status) ? status : 'draft';
    
    console.log('🔍 Final status:', finalStatus);

    // تحقق من وجود التيتشر
    const [teacher] = await pool.query<RowDataPacket[]>(
      `SELECT u.id FROM User u 
       JOIN Role r ON u.roleId = r.id 
       WHERE u.id = ? AND r.name = 'teacher'`,
      [teacherId]
    );

    console.log('👨‍🏫 Teacher check:', teacher);

    if (!teacher || teacher.length === 0) {
      return NextResponse.json(
        { message: 'Invalid teacher ID or not a teacher' },
        { status: 400 }
      );
    }

    // إضافة الكورس مع النسبة
    const [result] = await pool.query(
      `INSERT INTO Course (id, title, description, teacherId, price, teacherSharePct, status)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description.trim(), teacherId, price, teacherSharePct, finalStatus]
    );

    console.log('✅ Course added successfully:', result);

    return NextResponse.json(
      { success: true, message: 'Course created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error adding course:', error);
    
    const errorDetails = {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
    };
    
    console.error('Error details:', errorDetails);

    return NextResponse.json(
      { 
        message: 'Failed to add course',
        error: error.message,
        details: error.sqlMessage || 'Unknown database error'
      },
      { status: 500 }
    );
  }
}