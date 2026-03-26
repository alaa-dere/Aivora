// app/api/students/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';
import { RowDataPacket, OkPacket } from 'mysql2';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('id');

    if (studentId) {
      const studentRows = await db.query(
        `
          SELECT
            u.id,
            u.fullName,
            u.email,
            u.status,
            r.name AS role,
            u.createdAt,
            u.updatedAt
          FROM user u
          JOIN role r ON r.id = u.roleId
          WHERE u.id = ? AND r.name = 'student'
          LIMIT 1
        `,
        [studentId]
      );

      const student = (studentRows[0] as RowDataPacket[])[0];
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }

      const enrollmentStatsRows = await db.query(
        `
          SELECT
            COUNT(*) AS totalEnrollments,
            COUNT(DISTINCT e.courseId) AS totalCourses,
            SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedEnrollments,
            AVG(e.progressPercentage) AS avgProgress,
            MAX(e.enrolledAt) AS lastEnrollmentDate
          FROM enrollment e
          WHERE e.studentId = ?
        `,
        [studentId]
      );

      const financeRows = await db.query(
        `
          SELECT
            COALESCE(SUM(CASE WHEN ft.status = 'success' AND ft.type = 'enrollment' THEN ft.amount ELSE 0 END), 0) AS totalSpent,
            COALESCE(SUM(CASE
              WHEN ft.status = 'success'
                AND ft.type = 'enrollment'
                AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')
              THEN ft.amount
              ELSE 0
            END), 0) AS monthSpent,
            COALESCE(SUM(CASE WHEN ft.status = 'success' AND ft.type = 'refund' THEN ft.amount ELSE 0 END), 0) AS refundTotal
          FROM finance_transaction ft
          WHERE ft.studentId = ?
        `,
        [studentId]
      );

      const coursesRows = await db.query(
        `
          SELECT
            e.id AS enrollmentId,
            e.courseId,
            c.title,
            e.status,
            e.progressPercentage,
            e.enrolledAt,
            e.completedAt,
            c.price,
            t.fullName AS teacherName
          FROM enrollment e
          JOIN course c ON c.id = e.courseId
          LEFT JOIN user t ON t.id = c.teacherId
          WHERE e.studentId = ?
          ORDER BY e.enrolledAt DESC
        `,
        [studentId]
      );

      const transactionsRows = await db.query(
        `
          SELECT
            ft.id,
            DATE_FORMAT(ft.transactionDate, '%Y-%m-%d') AS date,
            DATE_FORMAT(ft.transactionDate, '%Y-%m-%d %H:%i') AS dateTime,
            ft.type,
            ft.status,
            ft.amount,
            ft.currency,
            c.title AS courseTitle
          FROM finance_transaction ft
          LEFT JOIN course c ON c.id = ft.courseId
          WHERE ft.studentId = ?
          ORDER BY ft.transactionDate DESC
          LIMIT 20
        `,
        [studentId]
      );

      const enrollmentStats = (enrollmentStatsRows[0] as RowDataPacket[])[0] || {};
      const financeStats = (financeRows[0] as RowDataPacket[])[0] || {};

      return NextResponse.json({
        student,
        stats: {
          totalCourses: Number(enrollmentStats.totalCourses || 0),
          totalEnrollments: Number(enrollmentStats.totalEnrollments || 0),
          completedEnrollments: Number(enrollmentStats.completedEnrollments || 0),
          avgProgress: Number(enrollmentStats.avgProgress || 0),
          lastEnrollmentDate: enrollmentStats.lastEnrollmentDate || null,
          totalSpent: Number(financeStats.totalSpent || 0),
          monthSpent: Number(financeStats.monthSpent || 0),
          refundTotal: Number(financeStats.refundTotal || 0),
        },
        courses: coursesRows[0] as RowDataPacket[],
        transactions: transactionsRows[0] as RowDataPacket[],
      });
    }

    const result = await db.query(`
      SELECT 
        u.id,
        u.fullName,
        u.email,
        u.status,
        DATE_FORMAT(u.createdAt, '%Y-%m-%d') AS createdAt
      FROM user u
      JOIN role r ON u.roleId = r.id
      WHERE r.name = 'student'
      ORDER BY u.createdAt DESC
    `);

    const rows = result[0] as RowDataPacket[];
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

    const emailCheck = await db.query('SELECT id FROM user WHERE email = ?', [email]);
    const existingRows = emailCheck[0] as RowDataPacket[];
    if (existingRows.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const roleCheck = await db.query("SELECT id FROM role WHERE name = 'student' LIMIT 1");
    const roleRows = roleCheck[0] as RowDataPacket[];
    if (roleRows.length === 0) {
      return NextResponse.json({ message: 'Student role not found' }, { status: 500 });
    }
    const studentRoleId = roleRows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const insertResult = await db.query(
      `INSERT INTO user (id, roleId, fullName, email, passwordHash, status)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [studentRoleId, fullName, email, passwordHash, status]
    );

    const insertInfo = insertResult[0] as OkPacket;

    const newStudent = {
      id: insertInfo.insertId || crypto.randomUUID(),
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

    const emailCheck = await db.query(
      'SELECT id FROM user WHERE email = ? AND id != ?',
      [email, id]
    );
    const existing = emailCheck[0] as RowDataPacket[];
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Email already in use by another student' }, { status: 409 });
    }

    await db.query(
      `UPDATE user 
       SET fullName = ?, email = ?, status = ?, updatedAt = NOW()
       WHERE id = ?`,
      [fullName, email, status, id]
    );

    const updatedStudent = {
      id,
      fullName,
      email,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
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

    const deleteResult = await db.query('DELETE FROM user WHERE id = ?', [id]);
    const result = deleteResult[0] as OkPacket;

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ message: 'Failed to delete student' }, { status: 500 });
  }
}
