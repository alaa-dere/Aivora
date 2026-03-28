import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type MessageRow = RowDataPacket & {
  id: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = String(searchParams.get('conversationId') || '').trim();
  if (!conversationId) {
    return NextResponse.json({ message: 'conversationId required' }, { status: 400 });
  }

  try {
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
    const conv = convRows[0] as any;
    if (user.id !== conv.studentId && user.id !== conv.teacherId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.query<MessageRow[]>(
      `
      SELECT id, senderId, senderRole, body, createdAt
      FROM chat_message
      WHERE conversationId = ?
      ORDER BY createdAt ASC
      LIMIT 200
      `,
      [conversationId]
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
  } catch (error: any) {
    console.error('Chat messages load error:', error);
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to load messages', error: error.message },
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
    const conv = convRows[0] as any;
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
  } catch (error: any) {
    console.error('Chat messages send error:', error);
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to send message', error: error.message },
      { status: 500 }
    );
  }
}
