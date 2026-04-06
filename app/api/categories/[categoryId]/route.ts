import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ categoryId: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:edit');
  if (authError) return authError;

  const { categoryId } = await params;
  const id = decodeURIComponent(categoryId).trim();

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description =
      typeof body?.description === 'string' ? body.description.trim() : null;
    const status =
      body?.status === 'inactive' ? 'inactive' : ('active' as const);

    if (!name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM category WHERE id = ? LIMIT 1`,
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    const [dupRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM category WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1`,
      [name, id]
    );
    if (dupRows.length > 0) {
      return NextResponse.json(
        { message: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    await pool.query<ResultSetHeader>(
      `
      UPDATE category
      SET
        name = ?,
        description = ?,
        status = ?,
        updatedAt = NOW()
      WHERE id = ?
      `,
      [name, description, status, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      {
        message: 'Failed to update category',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:delete');
  if (authError) return authError;

  const { categoryId } = await params;
  const id = decodeURIComponent(categoryId).trim();

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM category WHERE id = ? LIMIT 1`,
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    await pool.query<ResultSetHeader>(`DELETE FROM category WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete category',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
