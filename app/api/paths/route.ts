import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import { getRequestUser, requirePermission } from '@/lib/request-auth';
import { ensureLearningPathSchema } from '@/lib/ensure-learning-path-schema';

type PathLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
type PathStatus = 'draft' | 'published' | 'archived';

export async function GET(req: Request) {
  await ensureLearningPathSchema();

  const user = await getRequestUser(req);
  const isAdminView = user?.role === 'admin' || user?.role === 'teacher';

  try {
    const whereClause = isAdminView ? '' : `WHERE lp.status = 'published'`;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        lp.id,
        lp.title,
        lp.description,
        lp.level,
        lp.status,
        lp.price,
        lp.estimatedHours,
        lp.categoryId,
        c.name AS categoryName,
        DATE_FORMAT(lp.createdAt, '%Y-%m-%d') AS createdAt,
        (
          SELECT COUNT(*)
          FROM learning_path_course lpc
          WHERE lpc.pathId = lp.id
        ) AS coursesCount,
        (
          SELECT GROUP_CONCAT(lpc.courseId ORDER BY lpc.orderNumber SEPARATOR ',')
          FROM learning_path_course lpc
          WHERE lpc.pathId = lp.id
        ) AS courseIdsCsv,
        (
          SELECT COUNT(*)
          FROM path_enrollment pe
          WHERE pe.pathId = lp.id
        ) AS enrolledStudents
      FROM learning_path lp
      LEFT JOIN category c ON c.id = lp.categoryId
      ${whereClause}
      ORDER BY lp.createdAt DESC
      `
    );

    const paths = rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      level: row.level as PathLevel,
      status: row.status as PathStatus,
      price: Number(row.price || 0),
      estimatedHours: Number(row.estimatedHours || 0),
      categoryId: row.categoryId as string | null,
      categoryName: row.categoryName as string | null,
      courseIds: typeof row.courseIdsCsv === 'string' && row.courseIdsCsv.length > 0
        ? (row.courseIdsCsv as string).split(',').filter(Boolean)
        : ([] as string[]),
      createdAt: row.createdAt as string,
      coursesCount: Number(row.coursesCount || 0),
      enrolledStudents: Number(row.enrolledStudents || 0),
    }));

    return NextResponse.json({ paths });
  } catch (error: unknown) {
    console.error('Error fetching paths:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch paths',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authError = await requirePermission(req, 'course:create');
  if (authError) return authError;
  await ensureLearningPathSchema();
  const user = await getRequestUser(req);

  const conn = await pool.getConnection();
  try {
    const body = await req.json().catch(() => ({}));

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description =
      typeof body?.description === 'string' ? body.description.trim() : null;
    const categoryId =
      typeof body?.categoryId === 'string' && body.categoryId.trim()
        ? body.categoryId.trim()
        : null;
    const rawLevel = typeof body?.level === 'string' ? body.level : '';
    const rawStatus = typeof body?.status === 'string' ? body.status : '';
    const estimatedHours = Number(body?.estimatedHours || 0);
    const price = Number(body?.price || 0);
    const courseIds: string[] = Array.isArray(body?.courseIds)
      ? body.courseIds.filter((id: unknown) => typeof id === 'string' && id.trim())
      : [];
    const uniqueCourseIds = [...new Set(courseIds)];

    if (!title) {
      return NextResponse.json({ message: 'Path title is required' }, { status: 400 });
    }
    if (price < 0) {
      return NextResponse.json({ message: 'Path price cannot be negative' }, { status: 400 });
    }
    if (estimatedHours < 0) {
      return NextResponse.json(
        { message: 'Estimated hours cannot be negative' },
        { status: 400 }
      );
    }

    const level: PathLevel = ['beginner', 'intermediate', 'advanced', 'all_levels'].includes(
      rawLevel
    )
      ? (rawLevel as PathLevel)
      : 'beginner';

    const status: PathStatus = ['draft', 'published', 'archived'].includes(rawStatus)
      ? (rawStatus as PathStatus)
      : 'draft';

    if (categoryId) {
      const [categoryRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM category WHERE id = ? LIMIT 1`,
        [categoryId]
      );
      if (categoryRows.length === 0) {
        return NextResponse.json({ message: 'Invalid category selected' }, { status: 400 });
      }
    }

    if (uniqueCourseIds.length > 0) {
      const placeholders = uniqueCourseIds.map(() => '?').join(', ');
      const [courseRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM course WHERE id IN (${placeholders})`,
        uniqueCourseIds
      );
      if (courseRows.length !== uniqueCourseIds.length) {
        return NextResponse.json(
          { message: 'One or more selected courses were not found' },
          { status: 400 }
        );
      }
    }

    await conn.beginTransaction();

    const [idRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const pathId = idRows[0].id as string;

    await conn.query<OkPacket>(
      `
      INSERT INTO learning_path
        (id, categoryId, title, description, level, price, status, estimatedHours, createdBy, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [pathId, categoryId, title, description, level, price, status, estimatedHours, user?.id || null]
    );

    for (let i = 0; i < uniqueCourseIds.length; i++) {
      const [mapRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const mapId = mapRows[0].id as string;
      await conn.query<ResultSetHeader>(
        `
        INSERT INTO learning_path_course
          (id, pathId, courseId, orderNumber, isRequired, createdAt)
        VALUES
          (?, ?, ?, ?, TRUE, NOW())
        `,
        [mapId, pathId, uniqueCourseIds[i], i + 1]
      );
    }

    await conn.commit();

    return NextResponse.json(
      { success: true, pathId, message: 'Learning path created successfully' },
      { status: 201 }
    );
  } catch (error: unknown) {
    await conn.rollback();
    console.error('Error creating path:', error);
    return NextResponse.json(
      {
        message: 'Failed to create path',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
