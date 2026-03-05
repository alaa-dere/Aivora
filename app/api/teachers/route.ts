// app/api/teachers/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';
import { RowDataPacket, OkPacket } from 'mysql2'; // ← مهم جدًا تضيفي ده

export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.fullName,
        u.email,
        u.status,
        DATE_FORMAT(u.createdAt, '%Y-%m-%d') AS createdAt
      FROM User u
      JOIN Role r ON u.roleId = r.id
      WHERE r.name = 'teacher'
      ORDER BY u.createdAt DESC
    `);

    const rows = result[0] as RowDataPacket[]; // ← الحل هنا: result[0] فقط

    return NextResponse.json({ teachers: rows });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ message: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password, status = 'active' } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // 1. Check if email already exists
    const emailCheck = await db.query('SELECT id FROM User WHERE email = ?', [email]);
    const existingRows = emailCheck[0] as RowDataPacket[];
    if (existingRows.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    // 2. Get roleId for 'teacher'
    const roleCheck = await db.query("SELECT id FROM Role WHERE name = 'teacher' LIMIT 1");
    const roleRows = roleCheck[0] as RowDataPacket[];
    if (roleRows.length === 0) {
      return NextResponse.json({ message: 'teacher role not found' }, { status: 500 });
    }
    const teacherRoleId = roleRows[0].id;

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert new teacher
  const insertResult = await db.query(
  `INSERT INTO User (id, roleId, fullName, email, passwordHash, status, createdAt, updatedAt)
   VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
  [teacherRoleId, fullName, email, passwordHash, status]
);

    // insertResult[0] هو OkPacket
    const insertInfo = insertResult[0] as OkPacket;

    const newTeacher = {
      id: crypto.randomUUID(), // لو الـ id في الجدول UUID() مش AUTO_INCREMENT
      fullName,
      email,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    return NextResponse.json({ success: true, teacher: newTeacher }, { status: 201 });
  } catch (error) {
    console.error('Error adding teacher:', error);
    return NextResponse.json({ message: 'Failed to add teacher' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, fullName, email, status } = body;

    if (!id || !fullName || !email || !status) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Check if email exists for another teacher
    const emailCheck = await db.query(
      'SELECT id FROM User WHERE email = ? AND id != ?',
      [email, id]
    );
    const existing = emailCheck[0] as RowDataPacket[];
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Email already in use by another teacher' }, { status: 409 });
    }

    // Update teacher
    await db.query(
      `UPDATE User 
       SET fullName = ?, email = ?, status = ?, updatedAt = NOW()
       WHERE id = ?`,
      [fullName, email, status, id]
    );

    const updatedTeacher = {
      id,
      fullName,
      email,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    return NextResponse.json({ success: true, teacher: updatedTeacher }, { status: 200 });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ message: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Teacher ID is required' }, { status: 400 });
    }

    const deleteResult = await db.query('DELETE FROM User WHERE id = ?', [id]);
    const result = deleteResult[0] as OkPacket;

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ message: 'Failed to delete teacher' }, { status: 500 });
  }
}