import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getRequestUser, requirePermission } from '@/lib/request-auth';
import { ensureCourseEvaluationSchema } from '@/lib/ensure-course-evaluation-schema';

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function hasTable(tableName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    LIMIT 1
    `,
    [tableName]
  );
  return rows.length > 0;
}

export async function GET(req: Request) {
  try {
    let canUseCourseEvaluation = true;
    try {
      await ensureCourseEvaluationSchema();
      canUseCourseEvaluation = await hasColumn('course_evaluation', 'rating');
    } catch (schemaError) {
      canUseCourseEvaluation = false;
      console.warn('Course evaluation schema unavailable, continuing without rating stats:', schemaError);
    }

    const user = await getRequestUser(req);
    const includeEnrollment = user?.role === 'student';
    const hasCategoryTable = await hasTable('category');
    const hasCategoryId = await hasColumn('course', 'categoryId');
    const hasImageUrl = await hasColumn('course', 'imageUrl');
    const hasDurationWeeks = await hasColumn('course', 'durationWeeks');
    const hasPrice = await hasColumn('course', 'price');
    const hasTeacherSharePct = await hasColumn('course', 'teacherSharePct');
    const hasStatus = await hasColumn('course', 'status');
    const hasCreatedAt = await hasColumn('course', 'createdAt');

    const enrollmentSelect = includeEnrollment
      ? `, EXISTS(
          SELECT 1
          FROM enrollment e
          WHERE e.courseId = c.id AND e.studentId = ?
        ) AS enrolled`
      : `, 0 AS enrolled`;
    const evaluationSelect = canUseCourseEvaluation
      ? `
        (
          SELECT AVG(ce.rating)
          FROM course_evaluation ce
          WHERE ce.courseId = c.id
            AND ce.rating IS NOT NULL
        ) AS averageRating,
        (
          SELECT COUNT(*)
          FROM course_evaluation ce
          WHERE ce.courseId = c.id
            AND ce.rating IS NOT NULL
        ) AS evaluationCount
      `
      : `
        0 AS averageRating,
        0 AS evaluationCount
      `;

    const categoryJoin =
      hasCategoryTable && hasCategoryId
        ? `LEFT JOIN category cat ON c.categoryId = cat.id`
        : ``;

    const categoryIdSelect = hasCategoryId ? `c.categoryId` : `NULL`;
    const categoryNameSelect =
      hasCategoryTable && hasCategoryId ? `cat.name` : `NULL`;

    const sql = `
      SELECT 
        c.id,
        c.title,
        LEFT(c.description, 150) AS description,
        ${hasImageUrl ? 'c.imageUrl' : 'NULL'} AS imageUrl,
        ${hasDurationWeeks ? 'c.durationWeeks' : '0'} AS durationWeeks,
        ${categoryIdSelect} AS categoryId,
        ${categoryNameSelect} AS categoryName,
        u.fullName AS teacherName,
        u.id AS teacherId,
        ${hasPrice ? 'c.price' : '0'} AS price,
        ${hasTeacherSharePct ? 'c.teacherSharePct' : '70'} AS teacherSharePct,
        ${hasStatus ? 'c.status' : "'draft'"} AS status,
        ${hasCreatedAt ? "DATE_FORMAT(c.createdAt, '%Y-%m-%d')" : 'NULL'} AS createdAt,
        (
          SELECT COUNT(*) 
          FROM enrollment 
          WHERE courseId = c.id
        ) AS students,
        ${evaluationSelect}
        ${enrollmentSelect}
      FROM course c
      ${categoryJoin}
      JOIN user u ON c.teacherId = u.id
      ORDER BY ${hasCreatedAt ? 'c.createdAt' : 'c.id'} DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(
      sql,
      includeEnrollment ? [user?.id] : []
    );

    const courses = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      durationWeeks: Number(row.durationWeeks || 0),
      categoryId: row.categoryId || null,
      categoryName: row.categoryName || null,
      teacherName: row.teacherName,
      teacherId: row.teacherId,
      price: Number(row.price),
      teacherSharePct: Number(row.teacherSharePct),
      status: row.status,
      createdAt: row.createdAt,
      students: Number(row.students || 0),
      enrolled: Boolean(row.enrolled),
      averageRating:
        row.averageRating === null || row.averageRating === undefined
          ? 0
          : Number(row.averageRating),
      evaluationCount: Number(row.evaluationCount || 0),
    }));

    return NextResponse.json({ courses });
  } catch (error: unknown) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch courses',
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
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const teacherId = formData.get('teacherId') as string;
    const price = Number(formData.get('price') || 0);
    const durationWeeks = Number(formData.get('durationWeeks') || 0);
    const teacherSharePct = Number(formData.get('teacherSharePct') || 70);
    const statusRaw = formData.get('status') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title?.trim() || !description?.trim() || !teacherId) {
      return NextResponse.json(
        { message: 'Title, description, and teacher are required' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { message: 'Price cannot be less than 0' },
        { status: 400 }
      );
    }

    if (durationWeeks < 1) {
      return NextResponse.json(
        { message: 'Duration must be at least 1 week' },
        { status: 400 }
      );
    }

    if (teacherSharePct < 0 || teacherSharePct > 100) {
      return NextResponse.json(
        { message: 'Teacher share must be between 0 and 100' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'published', 'archived'];
    const finalStatus = validStatuses.includes(statusRaw) ? statusRaw : 'draft';

    const [teacherCheck] = await pool.query<RowDataPacket[]>(
      `
      SELECT u.id
      FROM user u
      JOIN role r ON u.roleId = r.id
      WHERE u.id = ? AND r.name = 'teacher'
      `,
      [teacherId]
    );

    if (teacherCheck.length === 0) {
      return NextResponse.json(
        { message: 'Invalid teacher ID or selected user is not a teacher' },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
      await mkdir(uploadsDir, { recursive: true });

      const extensionFromName = imageFile.name.split('.').pop()?.toLowerCase();
      const extensionFromType = imageFile.type.split('/').pop()?.toLowerCase();
      const ext = extensionFromName || extensionFromType || 'jpg';

      const safeTitle = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
        .replace(/^-+|-+$/g, '');

      const fileName = `${Date.now()}-${safeTitle}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await writeFile(filePath, buffer);

      imageUrl = `/uploads/courses/${fileName}`;
    }

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const courseId = idRows[0].id as string;

    await pool.query<OkPacket>(
      `
      INSERT INTO course
        (id, title, description, imageUrl, durationWeeks, teacherId, price, teacherSharePct, status, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        courseId,
        title.trim(),
        description.trim(),
        imageUrl,
        durationWeeks,
        teacherId,
        price,
        teacherSharePct,
        finalStatus,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        courseId,
        imageUrl,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        message: 'Failed to create course',
        error: error instanceof Error ? error.message : 'Unknown error',
        sqlMessage:
          typeof error === 'object' && error !== null && 'sqlMessage' in error
            ? String((error as { sqlMessage?: unknown }).sqlMessage ?? '')
            : undefined,
      },
      { status: 500 }
    );
  }
}
