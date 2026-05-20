import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = String(searchParams.get('conversationId') || '').trim();
  const sinceParam = searchParams.get('since');
  if (!conversationId) {
    return NextResponse.json({ message: 'conversationId required' }, { status: 400 });
  }

  let convRows: RowDataPacket[];
  try {
    [convRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, studentId, teacherId
      FROM chat_conversation
      WHERE id = ?
      LIMIT 1
      `,
      [conversationId]
    );
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { message: 'Chat tables not ready. Run the chat migration.' },
        { status: 503 }
      );
    }
    throw error;
  }
  if (convRows.length === 0) {
    return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
  }
  const conv = convRows[0] as any;
  if (user.id !== conv.studentId && user.id !== conv.teacherId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let lastSeen = sinceParam ? new Date(Number(sinceParam)) : new Date(0);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const ping = () => {
        controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
      };

      const intervalId = setInterval(async () => {
        try {
          const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT id, senderId, senderRole, body, createdAt
            FROM chat_message
            WHERE conversationId = ? AND createdAt > ?
            ORDER BY createdAt ASC
            LIMIT 50
            `,
            [conversationId, lastSeen]
          );

          if (rows.length > 0) {
            for (const row of rows as any[]) {
              send(row);
              const createdAt = new Date(row.createdAt);
              if (createdAt > lastSeen) lastSeen = createdAt;
            }
          } else {
            ping();
          }
        } catch (err) {
          controller.error(err);
          clearInterval(intervalId);
        }
      }, 2000);

      return () => {
        clearInterval(intervalId);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
