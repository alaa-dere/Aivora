import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import { getRequestUser, requirePermission } from '@/lib/request-auth';
import { ensureLearningPathSchema } from '@/lib/ensure-learning-path-schema';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

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
        lp.imageUrl,
        lp.level,
        lp.status,
        lp.price,
        lp.estimatedHours,
        (
          SELECT COALESCE(SUM(COALESCE(c.durationWeeks, 0)), 0)
          FROM learning_path_course lpc
          JOIN course c ON c.id = lpc.courseId
          WHERE lpc.pathId = lp.id
        ) AS estimatedWeeks,
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
      imageUrl: row.imageUrl as string | null,
      level: row.level as PathLevel,
      status: row.status as PathStatus,
      price: Number(row.price || 0),
      estimatedHours: Number(row.estimatedHours || 0),
      estimatedWeeks: Number(row.estimatedWeeks || 0),
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
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    const isJson = contentType.includes('application/json');

    let title = '';
    let description: string | null = null;
    let imageUrl: string | null = null;
    let categoryId: string | null = null;
    let rawLevel = '';
    let rawStatus = '';
    let estimatedHours = 0;
    let price = 0;
    let courseIds: string[] = [];
    let imageFile: File | null = null;

    if (isMultipart) {
      const formData = await req.formData();
      title = String(formData.get('title') || '').trim();
      const descriptionRaw = String(formData.get('description') || '').trim();
      description = descriptionRaw || null;
      const categoryRaw = String(formData.get('categoryId') || '').trim();
      categoryId = categoryRaw || null;
      rawLevel = String(formData.get('level') || '');
      rawStatus = String(formData.get('status') || '');
      estimatedHours = Number(formData.get('estimatedHours') || 0);
      price = Number(formData.get('price') || 0);
      const courseIdsRaw = String(formData.get('courseIds') || '[]');
      const parsed = JSON.parse(courseIdsRaw) as unknown;
      courseIds = Array.isArray(parsed)
        ? parsed.filter((id: unknown) => typeof id === 'string' && id.trim())
        : [];
      imageFile = (formData.get('image') as File | null) ?? null;
    } else if (isJson) {
      const body = await req.json().catch(() => ({}));
      title = typeof body?.title === 'string' ? body.title.trim() : '';
      description =
        typeof body?.description === 'string' ? body.description.trim() : null;
      imageUrl =
        typeof body?.imageUrl === 'string' && body.imageUrl.trim()
          ? body.imageUrl.trim()
          : null;
      categoryId =
        typeof body?.categoryId === 'string' && body.categoryId.trim()
          ? body.categoryId.trim()
          : null;
      rawLevel = typeof body?.level === 'string' ? body.level : '';
      rawStatus = typeof body?.status === 'string' ? body.status : '';
      estimatedHours = Number(body?.estimatedHours || 0);
      price = Number(body?.price || 0);
      courseIds = Array.isArray(body?.courseIds)
        ? body.courseIds.filter((id: unknown) => typeof id === 'string' && id.trim())
        : [];
    } else {
      return NextResponse.json({ message: 'Unsupported content type' }, { status: 415 });
    }

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'paths');
      await mkdir(uploadsDir, { recursive: true });
      const extensionFromName = imageFile.name.split('.').pop()?.toLowerCase();
      const extensionFromType = imageFile.type.split('/').pop()?.toLowerCase();
      const ext = extensionFromName || extensionFromType || 'jpg';
      const safeTitle = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
        .replace(/^-+|-+$/g, '');
      const fileName = `${Date.now()}-${safeTitle || 'path'}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/paths/${fileName}`;
    }
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
        (id, categoryId, title, description, imageUrl, level, price, status, estimatedHours, createdBy, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        pathId,
        categoryId,
        title,
        description,
        imageUrl,
        level,
        price,
        status,
        estimatedHours,
        user?.id || null,
      ]
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
