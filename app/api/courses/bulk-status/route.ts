import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

const allowedStatuses = new Set(['draft', 'published', 'archived']);

export async function PATCH(req: Request) {
  const authError = await requirePermission(req, 'course:edit');
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const courseIds: string[] = Array.isArray(body?.courseIds)
      ? body.courseIds.filter((id: unknown) => typeof id === 'string' && id.trim())
      : [];
    const uniqueCourseIds = [...new Set(courseIds)];
    const status = typeof body?.status === 'string' ? body.status.trim() : '';

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ message: 'Invalid status selected' }, { status: 400 });
    }
    if (uniqueCourseIds.length === 0) {
      return NextResponse.json({ message: 'No courses selected' }, { status: 400 });
    }

    const placeholders = uniqueCourseIds.map(() => '?').join(', ');
    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM course WHERE id IN (${placeholders})`,
      uniqueCourseIds
    );
    if (courseRows.length !== uniqueCourseIds.length) {
      return NextResponse.json(
        { message: 'One or more selected courses were not found' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE course
      SET status = ?, updatedAt = NOW()
      WHERE id IN (${placeholders})
      `,
      [status, ...uniqueCourseIds]
    );

    return NextResponse.json({
      success: true,
      message: 'Course statuses updated successfully',
      affectedRows: result.affectedRows,
    });
  } catch (error: unknown) {
    console.error('Error bulk updating course statuses:', error);
    return NextResponse.json(
      {
        message: 'Failed to bulk update course statuses',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
