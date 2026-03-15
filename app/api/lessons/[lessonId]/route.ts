import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ lessonId: string }>;
}

const validTypes = ['text', 'code_example', 'live_python', 'video_embed', 'quiz', 'mixed'];

export async function PATCH(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:edit');
  if (authError) return authError;

  try {
    const { lessonId } = await params;
    const normalizedLessonId = decodeURIComponent(lessonId).trim();
    const body = await req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body?.title !== undefined && String(body.title).trim()) {
      updates.push('title = ?');
      values.push(String(body.title).trim());
    }

    if (body?.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description ? String(body.description).trim() : null);
    }

    if (body?.content !== undefined) {
      updates.push('content = ?');
      values.push(body.content ? String(body.content) : null);
    }

    if (body?.codeContent !== undefined) {
      updates.push('codeContent = ?');
      values.push(body.codeContent ? String(body.codeContent) : null);
    }

    if (body?.videoUrl !== undefined) {
      updates.push('videoUrl = ?');
      values.push(body.videoUrl ? String(body.videoUrl).trim() : null);
    }

    if (body?.durationMinutes !== undefined) {
      updates.push('durationMinutes = ?');
      values.push(Number(body.durationMinutes) || 0);
    }

    if (body?.isPublished !== undefined) {
      updates.push('isPublished = ?');
      values.push(Boolean(body.isPublished));
    }

    if (body?.type !== undefined) {
      const typeRaw = String(body.type);
      const type = validTypes.includes(typeRaw) ? typeRaw : 'text';
      updates.push('type = ?');
      values.push(type);
    }

    if (body?.enableLiveEditor !== undefined) {
      updates.push('enableLiveEditor = ?');
      values.push(Boolean(body.enableLiveEditor));
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes provided' }, { status: 400 });
    }

    values.push(normalizedLessonId);

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE Lesson
      SET ${updates.join(', ')}, updatedAt = NOW()
      WHERE id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { message: 'Failed to update lesson', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requirePermission(_req, 'course:delete');
  if (authError) return authError;

  try {
    const { lessonId } = await params;
    const normalizedLessonId = decodeURIComponent(lessonId).trim();

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM Lesson WHERE id = ?`,
      [normalizedLessonId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { message: 'Failed to delete lesson', error: error.message },
      { status: 500 }
    );
  }
}
