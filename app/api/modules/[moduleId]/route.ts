import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ moduleId: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:edit');
  if (authError) return authError;

  try {
    const { moduleId } = await params;
    const normalizedModuleId = decodeURIComponent(moduleId).trim();
    const body = await req.json();

    const title = body?.title !== undefined ? String(body.title).trim() : null;
    const description =
      body?.description !== undefined && body?.description !== null
        ? String(body.description).trim()
        : null;

    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (body?.description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes provided' }, { status: 400 });
    }

    values.push(normalizedModuleId);

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE Module
      SET ${updates.join(', ')}, updatedAt = NOW()
      WHERE id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { message: 'Failed to update module', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requirePermission(_req, 'course:delete');
  if (authError) return authError;

  try {
    const { moduleId } = await params;
    const normalizedModuleId = decodeURIComponent(moduleId).trim();

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM Module WHERE id = ?`,
      [normalizedModuleId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { message: 'Failed to delete module', error: error.message },
      { status: 500 }
    );
  }
}
