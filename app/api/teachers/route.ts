// app/api/teachers/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const [rows] = await db.query(`
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
    `) as [any[]];

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

    const [existingRows] = await db.query('SELECT id FROM User WHERE email = ?', [email]) as [any[]];
    if (existingRows.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const [roleRows] = await db.query("SELECT id FROM Role WHERE name = 'teacher' LIMIT 1") as [any[]];
    if (roleRows.length === 0) {
      return NextResponse.json({ message: 'Teacher role not found' }, { status: 500 });
    }
    const teacherRoleId = roleRows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO User (id, roleId, fullName, email, passwordHash, status)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [teacherRoleId, fullName, email, passwordHash, status]
    );

    const newTeacher = {
      id: crypto.randomUUID(),
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

    const [existing] = await db.query(
      'SELECT id FROM User WHERE email = ? AND id != ?',
      [email, id]
    ) as [any[]];
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Email already in use by another teacher' }, { status: 409 });
    }

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

    const [result] = await db.query('DELETE FROM User WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ message: 'Failed to delete teacher' }, { status: 500 });
  }
}