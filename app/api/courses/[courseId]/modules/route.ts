import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:add-chapter');
  if (authError) return authError;

  try {
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();
    const body = await req.json();

    const title = String(body?.title ?? '').trim();
    const description = body?.description ? String(body.description).trim() : null;

    if (!title) {
      return NextResponse.json({ message: 'Module title is required' }, { status: 400 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM Course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );

    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const [orderRows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(orderNumber), 0) AS maxOrder FROM Module WHERE courseId = ?`,
      [normalizedCourseId]
    );
    const nextOrder = Number(orderRows[0]?.maxOrder || 0) + 1;

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const moduleId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO Module (id, courseId, title, description, orderNumber, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [moduleId, normalizedCourseId, title, description, nextOrder]
    );

    return NextResponse.json(
      { success: true, moduleId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { message: 'Failed to create module', error: error.message },
      { status: 500 }
    );
  }
}
