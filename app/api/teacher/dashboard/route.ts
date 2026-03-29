import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

async function hasColumn(tableName: string, columnName: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function ensureAdminTeacherDeleteColumns() {
  const exists = await hasColumn('admin_teacher_message', 'deletedForEveryoneAt');
  if (exists) return;
  try {
    await pool.query(`
      ALTER TABLE admin_teacher_message
      ADD COLUMN deletedForAdminAt DATETIME NULL,
      ADD COLUMN deletedForTeacherAt DATETIME NULL,
      ADD COLUMN deletedForEveryoneAt DATETIME NULL,
      ADD INDEX idx_admin_teacher_deleted_everyone (deletedForEveryoneAt),
      ADD INDEX idx_admin_teacher_deleted_admin (deletedForAdminAt),
      ADD INDEX idx_admin_teacher_deleted_teacher (deletedForTeacherAt)
    `);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code !== 'ER_DUP_FIELDNAME' && code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }
}

async function ensureChatDeleteColumns() {
  const exists = await hasColumn('chat_message', 'deletedForEveryoneAt');
  if (exists) return;
  try {
    await pool.query(`
      ALTER TABLE chat_message
      ADD COLUMN deletedForStudentAt DATETIME NULL,
      ADD COLUMN deletedForTeacherAt DATETIME NULL,
      ADD COLUMN deletedForEveryoneAt DATETIME NULL,
      ADD INDEX idx_chat_deleted_everyone (deletedForEveryoneAt),
      ADD INDEX idx_chat_deleted_student (deletedForStudentAt),
      ADD INDEX idx_chat_deleted_teacher (deletedForTeacherAt)
    `);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code !== 'ER_DUP_FIELDNAME' && code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureAdminTeacherDeleteColumns();
    await ensureChatDeleteColumns();
    const teacherId = user.id;
    const { searchParams } = new URL(req.url);
    const notifications = searchParams.get('notifications');
    const hasAdminDeleteVisibility = await hasColumn(
      'admin_teacher_message',
      'deletedForEveryoneAt'
    );
    const hasChatDeleteVisibility = await hasColumn('chat_message', 'deletedForEveryoneAt');

    if (notifications) {
      if (notifications === 'count') {
        const [countRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM enrollment e
          JOIN course c ON c.id = e.courseId
          WHERE c.teacherId = ?
            AND e.enrolledAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          `,
          [teacherId]
        );
        const [messageRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM admin_teacher_message m
          JOIN admin_teacher_thread t ON t.id = m.threadId
          WHERE t.teacherId = ?
            AND m.senderRole = 'admin'
            AND m.readAt IS NULL
            ${hasAdminDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
          `,
          [teacherId]
        );
        const [studentMessageRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM chat_message m
          JOIN chat_conversation c ON c.id = m.conversationId
          WHERE c.teacherId = ?
            AND m.senderRole = 'student'
            AND m.readAt IS NULL
            ${hasChatDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
          `,
          [teacherId]
        );

        const enrollmentCount = Number(countRows[0]?.total || 0);
        const messageCount = Number(messageRows[0]?.total || 0);
        const studentMessageCount = Number(studentMessageRows[0]?.total || 0);
        return NextResponse.json({ total: enrollmentCount + messageCount + studentMessageCount });
      }

      const limit = notifications === 'all' ? 100 : 5;
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          e.id,
          e.enrolledAt,
          s.fullName AS studentName,
          c.title AS courseTitle
        FROM enrollment e
        JOIN course c ON c.id = e.courseId
        JOIN user s ON s.id = e.studentId
        WHERE c.teacherId = ?
        ORDER BY e.enrolledAt DESC
        LIMIT ${limit}
        `,
        [teacherId]
      );

      const [adminMessageRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          m.id,
          m.body,
          m.createdAt,
          m.readAt,
          u.fullName AS adminName
        FROM admin_teacher_message m
        JOIN admin_teacher_thread t ON t.id = m.threadId
        JOIN user u ON u.id = t.adminId
        WHERE t.teacherId = ?
          AND m.senderRole = 'admin'
          ${hasAdminDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
        ORDER BY m.createdAt DESC
        LIMIT ${limit}
        `,
        [teacherId]
      );
      const [studentMessageRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          m.id,
          m.body,
          m.createdAt,
          m.readAt,
          conv.id AS conversationId,
          s.fullName AS studentName,
          c.title AS courseTitle
        FROM chat_message m
        JOIN chat_conversation conv ON conv.id = m.conversationId
        JOIN user s ON s.id = conv.studentId
        JOIN course c ON c.id = conv.courseId
        WHERE conv.teacherId = ?
          AND m.senderRole = 'student'
          ${hasChatDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
        ORDER BY m.createdAt DESC
        LIMIT ${limit}
        `,
        [teacherId]
      );

      const enrollmentItems = rows.map((row) => ({
        id: row.id,
        type: 'course_enroll',
        title: 'New enrollment',
        message: `${row.studentName} enrolled in ${row.courseTitle}`,
        createdAt: row.enrolledAt,
        read: false,
      }));

      const messageItems = adminMessageRows.map((row) => ({
        id: row.id,
        type: 'admin_message',
        title: `Message from ${row.adminName || 'Admin'}`,
        message: row.body,
        createdAt: row.createdAt,
        read: Boolean(row.readAt),
      }));
      const studentMessageItems = studentMessageRows.map((row) => ({
        id: row.id,
        type: 'student_message',
        title: `Message from ${row.studentName || 'Student'}`,
        message: row.body,
        createdAt: row.createdAt,
        read: Boolean(row.readAt),
        conversationId: row.conversationId,
      }));

      const items = [...enrollmentItems, ...messageItems, ...studentMessageItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return NextResponse.json({ notifications: items });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, status
      FROM course
      WHERE teacherId = ?
      `,
      [teacherId]
    );

    const courseIds = courseRows.map((row) => row.id as string);
    const activeCourses = courseRows.filter((row) => row.status === 'published').length;

    let totalStudents = 0;
    let avgProgress = 0;

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const [studentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(DISTINCT studentId) AS totalStudents,
               AVG(progressPercentage) AS avgProgress
        FROM enrollment
        WHERE courseId IN (${placeholders})
        `,
        courseIds
      );
      totalStudents = Number(studentRows[0]?.totalStudents || 0);
      avgProgress = Number(studentRows[0]?.avgProgress || 0);
    }

    const stats = {
      totalStudents,
      activeCourses,
      avgScore: Math.round(avgProgress),
      completion: Math.round(avgProgress),
    };

    const [coursesList] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.id,
        c.title,
        c.status,
        c.description,
        (
          SELECT COUNT(*) FROM enrollment e WHERE e.courseId = c.id
        ) AS students,
        (
          SELECT COUNT(*) FROM module m WHERE m.courseId = c.id
        ) AS modules,
        (
          SELECT COUNT(*) 
          FROM lesson l 
          JOIN module m2 ON m2.id = l.moduleId
          WHERE m2.courseId = c.id
        ) AS lessons,
        (
          SELECT AVG(e.progressPercentage) FROM enrollment e WHERE e.courseId = c.id
        ) AS progress
      FROM course c
      WHERE c.teacherId = ?
      ORDER BY c.updatedAt DESC
      LIMIT 4
      `,
      [teacherId]
    );

    const courses = coursesList.map((row) => ({
      id: row.id,
      name: row.title,
      code: row.id,
      students: Number(row.students || 0),
      completion: Math.round(Number(row.progress || 0)),
      averageScore: Math.round(Number(row.progress || 0)),
      status: row.status === 'published' ? 'active' : 'draft',
      description: row.description || '',
    }));

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        u.fullName AS name,
        e.progressPercentage AS progress,
        e.status AS status
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      LIMIT 4
      `,
      [teacherId]
    );

    const students = studentRows.map((row) => ({
      name: row.name,
      avatar: (row.name || '?')
        .split(' ')
        .map((part: string) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      progress: Math.round(Number(row.progress || 0)),
      status: Number(row.progress || 0) >= 60 ? 'passed' : 'failed',
    }));

    const [activityRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        u.fullName AS studentName,
        c.title AS courseTitle,
        e.enrolledAt AS time
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      LIMIT 3
      `,
      [teacherId]
    );

    const recentActivities = activityRows.map((row) => ({
      type: 'ENROLL',
      description: `${row.studentName} enrolled in ${row.courseTitle}`,
      time: new Date(row.time).toLocaleString('en-US'),
    }));

    return NextResponse.json({
      stats,
      courses,
      students,
      recentActivities,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Teacher dashboard error:', error);
    return NextResponse.json(
      { message: 'Failed to load teacher dashboard', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
