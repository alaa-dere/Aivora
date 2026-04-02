import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type TeacherRow = RowDataPacket & {
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherImageUrl: string | null;
  conversationId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

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
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureChatDeleteColumns();
    const { searchParams } = new URL(req.url);
    const unreadCountOnly = searchParams.get('unreadCount') === '1';
    const supportsDeleteVisibility = await hasColumn('chat_message', 'deletedForEveryoneAt');

    const [rows] = await pool.query<TeacherRow[]>(
      `
      SELECT
        c.id AS courseId,
        c.title AS courseTitle,
        t.id AS teacherId,
        t.fullName AS teacherName,
        t.email AS teacherEmail,
        t.imageUrl AS teacherImageUrl,
        conv.id AS conversationId,
        lm.body AS lastMessage,
        lm.createdAt AS lastMessageAt,
        COALESCE(unread.unreadCount, 0) AS unreadCount
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user t ON t.id = c.teacherId
      LEFT JOIN chat_conversation conv
        ON conv.courseId = c.id
       AND conv.studentId = e.studentId
       AND conv.teacherId = t.id
      LEFT JOIN (
        SELECT m.conversationId, m.body, m.createdAt
        FROM chat_message m
        JOIN (
          SELECT conversationId, MAX(createdAt) AS maxCreated
          FROM chat_message
          ${supportsDeleteVisibility ? 'WHERE deletedForEveryoneAt IS NULL AND deletedForStudentAt IS NULL' : ''}
          GROUP BY conversationId
        ) x
          ON x.conversationId = m.conversationId AND x.maxCreated = m.createdAt
        ${supportsDeleteVisibility ? 'WHERE m.deletedForEveryoneAt IS NULL AND m.deletedForStudentAt IS NULL' : ''}
      ) lm
        ON lm.conversationId = conv.id
      LEFT JOIN (
        SELECT m.conversationId, COUNT(*) AS unreadCount
        FROM chat_message m
        WHERE m.senderRole = 'teacher'
          AND m.readAt IS NULL
          ${supportsDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForStudentAt IS NULL' : ''}
        GROUP BY m.conversationId
      ) unread
        ON unread.conversationId = conv.id
      WHERE e.studentId = ?
      ORDER BY c.title ASC
      `,
      [user.id]
    );

    if (unreadCountOnly) {
      const total = rows.reduce((sum, row) => sum + Number(row.unreadCount || 0), 0);
      return NextResponse.json({ total });
    }

    return NextResponse.json({
      teachers: rows.map((row) => ({
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        teacherEmail: row.teacherEmail,
        teacherImageUrl: row.teacherImageUrl || null,
        conversationId: row.conversationId,
        lastMessage: row.lastMessage,
        lastMessageAt: row.lastMessageAt,
        unreadCount: Number(row.unreadCount || 0),
      })),
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Student chat teachers error:', error);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ teachers: [], needsMigration: true });
    }
    return NextResponse.json(
      { message: 'Failed to load teachers', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
