import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        c.status,
        DATE_FORMAT(c.createdAt, '%Y-%m-%d') AS createdAt,
        (
          SELECT COUNT(*)
          FROM course crs
          WHERE crs.categoryId = c.id
        ) AS coursesCount,
        (
          SELECT COUNT(*)
          FROM learning_path lp
          WHERE lp.categoryId = c.id
        ) AS pathsCount
      FROM category c
      ORDER BY c.createdAt DESC
      `
    );

    const categories = rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | null,
      status: row.status as 'active' | 'inactive',
      createdAt: row.createdAt as string,
      coursesCount: Number(row.coursesCount || 0),
      pathsCount: Number(row.pathsCount || 0),
    }));

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authError = await requirePermission(req, 'course:create');
  if (authError) return authError;

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

    const [dupRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM category WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [name]
    );
    if (dupRows.length > 0) {
      return NextResponse.json(
        { message: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const categoryId = idRows[0].id as string;

    await pool.query<OkPacket>(
      `
      INSERT INTO category
        (id, name, description, status, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, NOW(), NOW())
      `,
      [categoryId, name, description, status]
    );

    return NextResponse.json(
      { success: true, categoryId, message: 'Category created successfully' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      {
        message: 'Failed to create category',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
