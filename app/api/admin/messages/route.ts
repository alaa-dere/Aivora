import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type ThreadRow = RowDataPacket & {
  id: string;
  teacherId: string;
  teacherName: string;
  lastMessageAt: string;
  lastMessage: string | null;
  unreadCount: number;
};

type MessageRow = RowDataPacket & {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'admin' | 'teacher';
  body: string;
  createdAt: string;
  readAt: string | null;
};

function mapSqlError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'ER_NO_SUCH_TABLE') {
    return 'Chat tables are missing. Please apply the latest database schema.';
  }
  if (code === 'ER_WARN_DATA_TRUNCATED' || code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    return 'Database enum values are outdated. Please apply the latest schema updates.';
  }
  return null;
}

async function getOrCreateThread(adminId: string, teacherId: string) {
  const [existingRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id
    FROM admin_teacher_thread
    WHERE adminId = ? AND teacherId = ?
    LIMIT 1
    `,
    [adminId, teacherId]
  );

  if (existingRows.length > 0) {
    return existingRows[0].id as string;
  }

  const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
  const threadId = idRows[0].id as string;
  await pool.query<ResultSetHeader>(
    `
    INSERT INTO admin_teacher_thread
      (id, adminId, teacherId, createdAt, lastMessageAt)
    VALUES
      (?, ?, ?, NOW(), NOW())
    `,
    [threadId, adminId, teacherId]
  );

  return threadId;
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureAdminTeacherDeleteColumns();
    const supportsDeleteVisibility = await hasColumn(
      'admin_teacher_message',
      'deletedForEveryoneAt'
    );
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');
    const markRead = searchParams.get('markRead') === '1';
    const unreadCountOnly = searchParams.get('unreadCount') === '1';

    if (!teacherId) {
      const [threadRows] = await pool.query<ThreadRow[]>(
        `
        SELECT
          t.id,
          t.teacherId,
          u.fullName AS teacherName,
          t.lastMessageAt,
          (
            SELECT m.body
            FROM admin_teacher_message m
            WHERE m.threadId = t.id
              ${supportsDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForAdminAt IS NULL' : ''}
            ORDER BY m.createdAt DESC
            LIMIT 1
          ) AS lastMessage,
          (
            SELECT COUNT(*)
            FROM admin_teacher_message m
            WHERE m.threadId = t.id
              AND m.senderRole = 'teacher'
              AND m.readAt IS NULL
              ${supportsDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForAdminAt IS NULL' : ''}
          ) AS unreadCount
        FROM admin_teacher_thread t
        JOIN user u ON u.id = t.teacherId
        WHERE t.adminId = ?
        ORDER BY t.lastMessageAt DESC
        `,
        [user.id]
      );

      if (unreadCountOnly) {
        const total = threadRows.reduce((sum, row) => sum + Number(row.unreadCount || 0), 0);
        return NextResponse.json({ total });
      }

      return NextResponse.json({ threads: threadRows });
    }

    const [threadRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT t.id, t.teacherId, u.fullName AS teacherName
      FROM admin_teacher_thread t
      JOIN user u ON u.id = t.teacherId
      WHERE t.adminId = ? AND t.teacherId = ?
      LIMIT 1
      `,
      [user.id, teacherId]
    );

    if (threadRows.length === 0) {
      return NextResponse.json({ thread: null, messages: [] });
    }

    const thread = threadRows[0];

    if (markRead) {
      await pool.query<ResultSetHeader>(
        `
        UPDATE admin_teacher_message
        SET readAt = NOW()
        WHERE threadId = ?
          AND senderRole = 'teacher'
          AND readAt IS NULL
        `,
        [thread.id]
      );
    }

    const [messageRows] = await pool.query<MessageRow[]>(
      `
      SELECT
        id,
        threadId,
        senderId,
        senderRole,
        body,
        createdAt,
        readAt
      FROM admin_teacher_message
      WHERE threadId = ?
        ${supportsDeleteVisibility ? 'AND deletedForEveryoneAt IS NULL AND deletedForAdminAt IS NULL' : ''}
      ORDER BY createdAt ASC
      LIMIT 200
      `,
      [thread.id]
    );

    return NextResponse.json({
      thread: {
        id: thread.id,
        teacherId: thread.teacherId,
        teacherName: thread.teacherName,
      },
      messages: messageRows,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Admin messages error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to load messages', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

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

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const teacherId = typeof body.teacherId === 'string' ? body.teacherId : '';
    const messageBody = typeof body.body === 'string' ? body.body.trim() : '';

    if (!teacherId || !messageBody) {
      return NextResponse.json({ message: 'Teacher and message are required' }, { status: 400 });
    }

    const threadId = await getOrCreateThread(user.id, teacherId);

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const messageId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO admin_teacher_message
        (id, threadId, senderId, senderRole, body, createdAt)
      VALUES
        (?, ?, ?, 'admin', ?, NOW())
      `,
      [messageId, threadId, user.id, messageBody]
    );

    await pool.query<ResultSetHeader>(
      `
      UPDATE admin_teacher_thread
      SET lastMessageAt = NOW()
      WHERE id = ?
      `,
      [threadId]
    );

    return NextResponse.json(
      { success: true, messageId, threadId },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Admin send message error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to send message', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';

    if (!threadId) {
      return NextResponse.json({ message: 'threadId is required' }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `
      UPDATE admin_teacher_message
      SET readAt = NOW()
      WHERE threadId = ?
        AND senderRole = 'teacher'
        AND readAt IS NULL
      `,
      [threadId]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Admin mark read error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to update messages', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureAdminTeacherDeleteColumns();
    const supportsDeleteVisibility = await hasColumn(
      'admin_teacher_message',
      'deletedForEveryoneAt'
    );
    const body = await req.json();
    const messageId = typeof body.messageId === 'string' ? body.messageId : '';
    const scope = body.scope === 'both' ? 'both' : 'self';

    if (!messageId) {
      return NextResponse.json({ message: 'messageId is required' }, { status: 400 });
    }

    const [result] = !supportsDeleteVisibility
      ? await pool.query<ResultSetHeader>(
          `
          DELETE m
          FROM admin_teacher_message m
          JOIN admin_teacher_thread t ON t.id = m.threadId
          WHERE m.id = ?
            AND t.adminId = ?
          `,
          [messageId, user.id]
        )
      : scope === 'both'
        ? await pool.query<ResultSetHeader>(
            `
            UPDATE admin_teacher_message m
            JOIN admin_teacher_thread t ON t.id = m.threadId
            SET m.deletedForEveryoneAt = NOW()
            WHERE m.id = ?
              AND t.adminId = ?
              AND m.deletedForEveryoneAt IS NULL
            `,
            [messageId, user.id]
          )
        : await pool.query<ResultSetHeader>(
            `
            UPDATE admin_teacher_message m
            JOIN admin_teacher_thread t ON t.id = m.threadId
            SET m.deletedForAdminAt = NOW()
            WHERE m.id = ?
              AND t.adminId = ?
              AND m.deletedForAdminAt IS NULL
              AND m.deletedForEveryoneAt IS NULL
            `,
            [messageId, user.id]
          );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Admin delete message error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to delete message', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
