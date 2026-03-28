import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type MessageRow = RowDataPacket & {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'admin' | 'teacher';
  body: string;
  createdAt: string;
  readAt: string | null;
};

async function getDefaultAdmin() {
  const [adminRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT u.id, u.fullName
    FROM user u
    JOIN role r ON r.id = u.roleId
    WHERE r.name = 'admin'
    ORDER BY u.createdAt ASC
    LIMIT 1
    `
  );

  return adminRows[0] as { id: string; fullName: string } | undefined;
}

function mapSqlError(error: any) {
  const code = error?.code;
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
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const markRead = searchParams.get('markRead') === '1';

    const adminFallback = await getDefaultAdmin();
    const resolvedAdminId = adminId || adminFallback?.id || '';

    const [threadRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT t.id, t.adminId, u.fullName AS adminName
      FROM admin_teacher_thread t
      JOIN user u ON u.id = t.adminId
      WHERE t.teacherId = ?
      ${resolvedAdminId ? 'AND t.adminId = ?' : ''}
      ORDER BY t.lastMessageAt DESC
      LIMIT 1
      `,
      resolvedAdminId ? [user.id, resolvedAdminId] : [user.id]
    );

    if (threadRows.length === 0) {
      if (!adminFallback) {
        return NextResponse.json(
          { message: 'Admin account not found. Create an admin user first.' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        thread: null,
        admin: adminFallback,
        messages: [],
      });
    }

    const thread = threadRows[0];

    if (markRead) {
      await pool.query<ResultSetHeader>(
        `
        UPDATE admin_teacher_message
        SET readAt = NOW()
        WHERE threadId = ?
          AND senderRole = 'admin'
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
      ORDER BY createdAt ASC
      LIMIT 200
      `,
      [thread.id]
    );

    return NextResponse.json({
      thread: {
        id: thread.id,
        adminId: thread.adminId,
        adminName: thread.adminName,
      },
      messages: messageRows,
    });
  } catch (error: any) {
    console.error('Teacher messages error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to load messages', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const payload = await req.json();
    const messageBody = typeof payload.body === 'string' ? payload.body.trim() : '';
    const adminId = typeof payload.adminId === 'string' ? payload.adminId : '';

    if (!messageBody) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    const admin = adminId ? { id: adminId } : await getDefaultAdmin();
    if (!admin) {
      return NextResponse.json(
        { message: 'Admin account not found. Create an admin user first.' },
        { status: 404 }
      );
    }

    const threadId = await getOrCreateThread(admin.id, user.id);

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const messageId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO admin_teacher_message
        (id, threadId, senderId, senderRole, body, createdAt)
      VALUES
        (?, ?, ?, 'teacher', ?, NOW())
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

    const [teacherRows] = await pool.query<RowDataPacket[]>(
      `SELECT fullName FROM user WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const teacherName = teacherRows[0]?.fullName || 'Teacher';

    try {
      const [notifIdRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const notifId = notifIdRows[0].id as string;
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO admin_notification
          (id, type, title, message, createdAt)
        VALUES
          (?, 'teacher_message', ?, ?, NOW())
        `,
        [notifId, `New message from ${teacherName}`, messageBody]
      );
    } catch (notifError: any) {
      console.error('Admin notification insert failed:', notifError);
    }

    return NextResponse.json(
      { success: true, messageId, threadId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Teacher send message error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to send message', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const payload = await req.json();
    const messageIds = Array.isArray(payload.messageIds) ? payload.messageIds : [];

    if (messageIds.length === 0) {
      return NextResponse.json({ message: 'messageIds are required' }, { status: 400 });
    }

    const placeholders = messageIds.map(() => '?').join(',');
    await pool.query<ResultSetHeader>(
      `
      UPDATE admin_teacher_message m
      JOIN admin_teacher_thread t ON t.id = m.threadId
      SET m.readAt = NOW()
      WHERE t.teacherId = ?
        AND m.senderRole = 'admin'
        AND m.readAt IS NULL
        AND m.id IN (${placeholders})
      `,
      [user.id, ...messageIds]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Teacher mark read error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to update messages', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const payload = await req.json();
    const messageId = typeof payload.messageId === 'string' ? payload.messageId : '';

    if (!messageId) {
      return NextResponse.json({ message: 'messageId is required' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      DELETE m
      FROM admin_teacher_message m
      JOIN admin_teacher_thread t ON t.id = m.threadId
      WHERE m.id = ?
        AND t.teacherId = ?
      `,
      [messageId, user.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Teacher delete message error:', error);
    const mapped = mapSqlError(error);
    return NextResponse.json(
      { message: mapped || 'Failed to delete message', error: error.message },
      { status: 500 }
    );
  }
}
