import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type MessageRow = RowDataPacket & {
  id: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt: string;
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
  if (!user) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = String(searchParams.get('conversationId') || '').trim();
  const markRead = searchParams.get('markRead') === '1';
  if (!conversationId) {
    return NextResponse.json({ message: 'conversationId required' }, { status: 400 });
  }

  try {
    await ensureChatDeleteColumns();
    const supportsDeleteVisibility = await hasColumn('chat_message', 'deletedForEveryoneAt');
    const [convRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, studentId, teacherId
      FROM chat_conversation
      WHERE id = ?
      LIMIT 1
      `,
      [conversationId]
    );
    if (convRows.length === 0) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }
    const conv = convRows[0] as { id: string; studentId: string; teacherId: string };
    if (user.id !== conv.studentId && user.id !== conv.teacherId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (markRead && user.role === 'teacher') {
      await pool.query(
        `
        UPDATE chat_message
        SET readAt = NOW()
        WHERE conversationId = ?
          AND senderRole = 'student'
          AND readAt IS NULL
        `,
        [conversationId]
      );
    }

    const [rows] = await pool.query<MessageRow[]>(
      `
      SELECT id, senderId, senderRole, body, createdAt
      FROM chat_message
      WHERE conversationId = ?
        ${
          supportsDeleteVisibility
            ? `AND deletedForEveryoneAt IS NULL
               AND (
                 (? = 'teacher' AND deletedForTeacherAt IS NULL)
                 OR (? = 'student' AND deletedForStudentAt IS NULL)
               )`
            : ''
        }
      ORDER BY createdAt ASC
      LIMIT 200
      `,
      supportsDeleteVisibility ? [conversationId, user.role, user.role] : [conversationId]
    );

    return NextResponse.json({
      messages: rows.map((row) => ({
        id: row.id,
        senderId: row.senderId,
        senderRole: row.senderRole,
        body: row.body,
        createdAt: row.createdAt,
      })),
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Chat messages load error:', error);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to load messages', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureChatDeleteColumns();
    const body = await req.json();
    const conversationId = String(body?.conversationId || '').trim();
    const messageBody = String(body?.body || '').trim();

    if (!conversationId || !messageBody) {
      return NextResponse.json({ message: 'conversationId and body required' }, { status: 400 });
    }

    const [convRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, studentId, teacherId
      FROM chat_conversation
      WHERE id = ?
      LIMIT 1
      `,
      [conversationId]
    );
    if (convRows.length === 0) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }
    const conv = convRows[0] as { id: string; studentId: string; teacherId: string };
    if (user.id !== conv.studentId && user.id !== conv.teacherId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const senderRole = user.id === conv.studentId ? 'student' : 'teacher';
    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const messageId = idRows[0].id as string;

    await pool.query(
      `
      INSERT INTO chat_message
        (id, conversationId, senderId, senderRole, body, createdAt)
      VALUES
        (?, ?, ?, ?, ?, NOW())
      `,
      [messageId, conversationId, user.id, senderRole, messageBody]
    );

    return NextResponse.json({
      message: {
        id: messageId,
        conversationId,
        senderId: user.id,
        senderRole,
        body: messageBody,
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Chat messages send error:', error);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to send message', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const messageId = String(body?.messageId || '').trim();
    const scope = body?.scope === 'both' ? 'both' : 'self';

    if (!messageId) {
      return NextResponse.json({ message: 'messageId required' }, { status: 400 });
    }

    const [result] = !supportsDeleteVisibility
      ? await pool.query<ResultSetHeader>(
          `
          DELETE m
          FROM chat_message m
          JOIN chat_conversation c ON c.id = m.conversationId
          WHERE m.id = ?
            AND (c.studentId = ? OR c.teacherId = ?)
          `,
          [messageId, user.id, user.id]
        )
      : scope === 'both'
        ? await pool.query<ResultSetHeader>(
            `
            UPDATE chat_message m
            JOIN chat_conversation c ON c.id = m.conversationId
            SET m.deletedForEveryoneAt = NOW()
            WHERE m.id = ?
              AND (c.studentId = ? OR c.teacherId = ?)
              AND m.deletedForEveryoneAt IS NULL
            `,
            [messageId, user.id, user.id]
          )
        : user.role === 'teacher'
          ? await pool.query<ResultSetHeader>(
              `
              UPDATE chat_message m
              JOIN chat_conversation c ON c.id = m.conversationId
              SET m.deletedForTeacherAt = NOW()
              WHERE m.id = ?
                AND c.teacherId = ?
                AND m.deletedForTeacherAt IS NULL
                AND m.deletedForEveryoneAt IS NULL
              `,
              [messageId, user.id]
            )
          : await pool.query<ResultSetHeader>(
              `
              UPDATE chat_message m
              JOIN chat_conversation c ON c.id = m.conversationId
              SET m.deletedForStudentAt = NOW()
              WHERE m.id = ?
                AND c.studentId = ?
                AND m.deletedForStudentAt IS NULL
                AND m.deletedForEveryoneAt IS NULL
              `,
              [messageId, user.id]
            );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Chat messages delete error:', error);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to delete message', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
