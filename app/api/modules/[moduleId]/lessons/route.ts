import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ moduleId: string }>;
}

const validTypes = ['text', 'code_example', 'live_python', 'video_embed', 'quiz', 'mixed'];

function normalizeLessonContent(content: string | null) {
  if (!content) return content;
  return content
    .replace(/\\`/g, '`')
    .replace(
      /```[ \t]*([a-zA-Z0-9_+-]+)[ \t]*\r?\n([\s\S]*?)```/g,
      (_match, _lang, codeBody: string) => `\`\`\`${codeBody}\`\`\``
    );
}

function inferType(textContent: string | null, codeContent: string | null, videoUrl: string | null) {
  const hasText = Boolean(textContent && textContent.trim());
  const hasCode = Boolean(codeContent && codeContent.trim());
  const hasVideo = Boolean(videoUrl && videoUrl.trim());

  if ((hasText && hasCode) || (hasVideo && (hasText || hasCode))) return 'mixed';
  if (hasVideo) return 'video_embed';
  if (hasCode && !hasText) return 'code_example';
  return 'text';
}

export async function POST(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:add-lesson');
  if (authError) return authError;

  try {
    const { moduleId } = await params;
    const normalizedModuleId = decodeURIComponent(moduleId).trim();
    const body = await req.json();

    const title = String(body?.title ?? '').trim();
    const description = body?.description ? String(body.description).trim() : null;
    const content = normalizeLessonContent(body?.content ? String(body.content) : null);
    const codeContent = body?.codeContent ? String(body.codeContent) : null;
    const videoUrl = body?.videoUrl ? String(body.videoUrl).trim() : null;
    const durationMinutes = Number(body?.durationMinutes ?? 0);
    const isPublished = Boolean(body?.isPublished);
    const typeRaw = String(body?.type ?? '');
    const type = validTypes.includes(typeRaw)
      ? typeRaw
      : inferType(content, codeContent, videoUrl);
    const enableLiveEditor = Boolean(body?.enableLiveEditor);
    const liveEditorLanguageRaw = String(body?.liveEditorLanguage ?? 'python');
    const liveEditorLanguage =
      liveEditorLanguageRaw === 'javascript' || liveEditorLanguageRaw === 'html_css'
        ? liveEditorLanguageRaw
        : 'python';

    if (!title) {
      return NextResponse.json({ message: 'Lesson title is required' }, { status: 400 });
    }

    const [moduleRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM module WHERE id = ? LIMIT 1`,
      [normalizedModuleId]
    );

    if (moduleRows.length === 0) {
      return NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }

    const [orderRows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(orderNumber), 0) AS maxOrder FROM lesson WHERE moduleId = ?`,
      [normalizedModuleId]
    );
    const nextOrder = Number(orderRows[0]?.maxOrder || 0) + 1;

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const lessonId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO lesson
        (id, moduleId, title, description, content, codeContent, videoUrl, orderNumber, durationMinutes, isPublished, type, enableLiveEditor, liveEditorLanguage, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        lessonId,
        normalizedModuleId,
        title,
        description,
        content,
        codeContent,
        videoUrl,
        nextOrder,
        durationMinutes,
        isPublished,
        type,
        enableLiveEditor,
        liveEditorLanguage,
      ]
    );

    return NextResponse.json(
      { success: true, lessonId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { message: 'Failed to create lesson', error: error.message },
      { status: 500 }
    );
  }
}
