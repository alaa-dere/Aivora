import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getRequestUser, requirePermission } from '@/lib/request-auth';
import { ensureCourseEvaluationSchema } from '@/lib/ensure-course-evaluation-schema';

export async function GET(req: Request) {
  try {
    await ensureCourseEvaluationSchema();
    const user = await getRequestUser(req);
    const includeEnrollment = user?.role === 'student';

    const enrollmentSelect = includeEnrollment
      ? `, EXISTS(
          SELECT 1
          FROM enrollment e
          WHERE e.courseId = c.id AND e.studentId = ?
        ) AS enrolled`
      : `, 0 AS enrolled`;

    const sql = `
      SELECT 
        c.id,
        c.title,
        LEFT(c.description, 150) AS description,
        c.imageUrl,
        c.durationWeeks,
        u.fullName AS teacherName,
        u.id AS teacherId,
        c.price,
        c.teacherSharePct,
        c.status,
        DATE_FORMAT(c.createdAt, '%Y-%m-%d') AS createdAt,
        (
          SELECT COUNT(*) 
          FROM enrollment 
          WHERE courseId = c.id
        ) AS students,
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
        ${enrollmentSelect}
      FROM course c
      JOIN user u ON c.teacherId = u.id
      ORDER BY c.createdAt DESC
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
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch courses',
        error: error.message,
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
  } catch (error: any) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        message: 'Failed to create course',
        error: error.message,
        sqlMessage: error.sqlMessage,
      },
      { status: 500 }
    );
  }
}
