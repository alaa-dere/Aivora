// app/api/teachers/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';
import { RowDataPacket, OkPacket } from 'mysql2';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('id');

    if (teacherId) {
      const teacherRows = await db.query(
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
          WHERE u.id = ? AND r.name = 'teacher'
          LIMIT 1
        `,
        [teacherId]
      );

      const teacher = (teacherRows[0] as RowDataPacket[])[0];
      if (!teacher) {
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      const courseStatsRows = await db.query(
        `
          SELECT
            COUNT(*) AS totalCourses,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedCourses,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draftCourses,
            SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archivedCourses
          FROM course
          WHERE teacherId = ?
        `,
        [teacherId]
      );

      const enrollmentStatsRows = await db.query(
        `
          SELECT
            COUNT(*) AS totalEnrollments,
            COUNT(DISTINCT e.studentId) AS totalStudents,
            SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedEnrollments,
            AVG(e.progressPercentage) AS avgProgress
          FROM enrollment e
          JOIN course c ON c.id = e.courseId
          WHERE c.teacherId = ?
        `,
        [teacherId]
      );

      const revenueRows = await db.query(
        `
          SELECT
            COALESCE(SUM(CASE WHEN ft.status = 'success' AND ft.type = 'enrollment' THEN ft.teacherShare ELSE 0 END), 0) AS totalRevenue,
            COALESCE(SUM(CASE WHEN ft.status = 'success' AND ft.type = 'enrollment' THEN ft.amount ELSE 0 END), 0) AS grossSales,
            COALESCE(SUM(CASE
              WHEN ft.status = 'success'
                AND ft.type = 'enrollment'
                AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')
              THEN ft.teacherShare
              ELSE 0
            END), 0) AS monthRevenue
          FROM finance_transaction ft
          WHERE ft.teacherId = ?
        `,
        [teacherId]
      );

      const coursesRows = await db.query(
        `
          SELECT
            c.id,
            c.title,
            c.status,
            c.price,
            c.durationWeeks,
            c.createdAt,
            COUNT(DISTINCT e.studentId) AS students,
            COALESCE(SUM(CASE WHEN ft.status = 'success' AND ft.type = 'enrollment' THEN ft.teacherShare ELSE 0 END), 0) AS revenue
          FROM course c
          LEFT JOIN enrollment e ON e.courseId = c.id
          LEFT JOIN finance_transaction ft ON ft.courseId = c.id AND ft.teacherId = c.teacherId
          WHERE c.teacherId = ?
          GROUP BY c.id
          ORDER BY c.createdAt DESC
        `,
        [teacherId]
      );

      const studentsRows = await db.query(
        `
          SELECT
            e.id AS enrollmentId,
            e.enrolledAt,
            e.status,
            e.progressPercentage,
            s.id AS studentId,
            s.fullName,
            s.email,
            c.title AS courseTitle
          FROM enrollment e
          JOIN course c ON c.id = e.courseId
          JOIN user s ON s.id = e.studentId
          WHERE c.teacherId = ?
          ORDER BY e.enrolledAt DESC
          LIMIT 50
        `,
        [teacherId]
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
            ft.teacherShare,
            ft.platformShare,
            s.fullName AS studentName,
            c.title AS courseTitle
          FROM finance_transaction ft
          LEFT JOIN user s ON s.id = ft.studentId
          LEFT JOIN course c ON c.id = ft.courseId
          WHERE ft.teacherId = ?
          ORDER BY ft.transactionDate DESC
          LIMIT 20
        `,
        [teacherId]
      );

      const courseStats = (courseStatsRows[0] as RowDataPacket[])[0] || {};
      const enrollmentStats = (enrollmentStatsRows[0] as RowDataPacket[])[0] || {};
      const revenueStats = (revenueRows[0] as RowDataPacket[])[0] || {};
      return NextResponse.json({
        teacher,
        stats: {
          totalCourses: Number(courseStats.totalCourses || 0),
          publishedCourses: Number(courseStats.publishedCourses || 0),
          draftCourses: Number(courseStats.draftCourses || 0),
          archivedCourses: Number(courseStats.archivedCourses || 0),
          totalStudents: Number(enrollmentStats.totalStudents || 0),
          totalEnrollments: Number(enrollmentStats.totalEnrollments || 0),
          completedEnrollments: Number(enrollmentStats.completedEnrollments || 0),
          avgProgress: Number(enrollmentStats.avgProgress || 0),
          totalRevenue: Number(revenueStats.totalRevenue || 0),
          monthRevenue: Number(revenueStats.monthRevenue || 0),
          grossSales: Number(revenueStats.grossSales || 0),
        },
        courses: coursesRows[0] as RowDataPacket[],
        students: studentsRows[0] as RowDataPacket[],
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
      WHERE r.name = 'teacher'
      ORDER BY u.createdAt DESC
    `);

    const rows = result[0] as RowDataPacket[];
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

    const emailCheck = await db.query('SELECT id FROM user WHERE email = ?', [email]);
    const existingRows = emailCheck[0] as RowDataPacket[];
    if (existingRows.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const roleCheck = await db.query("SELECT id FROM role WHERE name = 'teacher' LIMIT 1");
    const roleRows = roleCheck[0] as RowDataPacket[];
    if (roleRows.length === 0) {
      return NextResponse.json({ message: 'teacher role not found' }, { status: 500 });
    }
    const teacherRoleId = roleRows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const insertResult = await db.query(
      `INSERT INTO user (id, roleId, fullName, email, passwordHash, status, createdAt, updatedAt)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
      [teacherRoleId, fullName, email, passwordHash, status]
    );

    const insertInfo = insertResult[0] as OkPacket;

    const newTeacher = {
      id: insertInfo.insertId || crypto.randomUUID(),
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

    const emailCheck = await db.query(
      'SELECT id FROM user WHERE email = ? AND id != ?',
      [email, id]
    );
    const existing = emailCheck[0] as RowDataPacket[];
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Email already in use by another teacher' }, { status: 409 });
    }

    await db.query(
      `UPDATE user 
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

    const courseCheck = await db.query(
      'SELECT COUNT(*) AS courseCount FROM course WHERE teacherId = ?',
      [id]
    );
    const courseCount = Number((courseCheck[0] as RowDataPacket[])[0]?.courseCount || 0);

    if (courseCount > 0) {
      return NextResponse.json(
        {
          message: `This teacher is assigned to ${courseCount} course${courseCount === 1 ? '' : 's'}. Please reassign their courses before deleting.`,
        },
        { status: 409 }
      );
    }

    const deleteResult = await db.query('DELETE FROM user WHERE id = ?', [id]);
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
