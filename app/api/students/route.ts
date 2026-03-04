// app/api/students/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    // ← هنا الحل: أضفنا as [any[]]
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.fullName,
        u.email,
        u.status,
        DATE_FORMAT(u.createdAt, '%Y-%m-%d') AS createdAt
      FROM User u
      JOIN Role r ON u.roleId = r.id
      WHERE r.name = 'student'
      ORDER BY u.createdAt DESC
    `) as [any[]];

    return NextResponse.json({ students: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Failed to fetch students' }, { status: 500 });
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
    const [existingRows] = await db.query('SELECT id FROM User WHERE email = ?', [email]) as [any[]];
    if (existingRows.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    // 2. Get roleId for 'student'
    const [roleRows] = await db.query("SELECT id FROM Role WHERE name = 'student' LIMIT 1") as [any[]];
    if (roleRows.length === 0) {
      return NextResponse.json({ message: 'Student role not found' }, { status: 500 });
    }
    const studentRoleId = roleRows[0].id;

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert new student (no need for insertId since we use UUID())
    await db.query(
      `INSERT INTO User (id, roleId, fullName, email, passwordHash, status)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [studentRoleId, fullName, email, passwordHash, status]
    );

    const newStudent = {
      id: crypto.randomUUID(), // أو أي طريقة لتوليد id إذا بدك
      fullName,
      email,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    return NextResponse.json({ success: true, student: newStudent }, { status: 201 });
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json({ message: 'Failed to add student' }, { status: 500 });
  }
}
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, fullName, email, status } = body;

    if (!id || !fullName || !email || !status) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // تحقق إذا الإيميل موجود عند طالب تاني
    const [existing] = await db.query(
      'SELECT id FROM User WHERE email = ? AND id != ?',
      [email, id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Email already in use by another student' }, { status: 409 });
    }

    // تحديث الطالب
    await db.query(
      `UPDATE User 
       SET fullName = ?, email = ?, status = ?, updatedAt = NOW()
       WHERE id = ?`,
      [fullName, email, status, id]
    );

    const updatedStudent = {
      id,
      fullName,
      email,
      status,
      createdAt: new Date().toISOString().slice(0, 10), // أو اجيبيه من الداتابيز لو بدك
    };

    return NextResponse.json({ success: true, student: updatedStudent }, { status: 200 });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ message: 'Failed to update student' }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Student ID is required' }, { status: 400 });
    }

    // حذف الطالب
    const [result] = await db.query('DELETE FROM User WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ message: 'Failed to delete student' }, { status: 500 });
  }
}