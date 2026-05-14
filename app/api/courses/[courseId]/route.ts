import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { getRequestUser, requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

function isLockTimeoutError(error: unknown) {
  const code = (error as { code?: string })?.code;
  return code === 'ER_LOCK_WAIT_TIMEOUT' || code === 'ER_LOCK_DEADLOCK';
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasColumn(tableName: string, columnName: string) {
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

export async function GET(req: Request, { params }: Params) {
  try {
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();
    const user = await getRequestUser(req);
    const includeEnrollment = user?.role === 'student';
    const hasArabicDescription = await hasColumn('course', 'descriptionAr');
    const descriptionArSelect = hasArabicDescription
      ? 'c.descriptionAr'
      : 'NULL AS descriptionAr';

    console.log('Route param courseId:', courseId);
    console.log('Normalized courseId:', normalizedCourseId);

    const [basicRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, teacherId FROM course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );

    console.log('Basic query result:', basicRows);

    if (basicRows.length === 0) {
      return NextResponse.json(
        { message: 'Course not found at basic query level', courseId: normalizedCourseId },
        { status: 404 }
      );
    }

    const enrollmentSelect = includeEnrollment
      ? `, EXISTS(
          SELECT 1
          FROM enrollment e2
          WHERE e2.courseId = c.id AND e2.studentId = ?
        ) AS enrolled`
      : `, 0 AS enrolled`;

    const sql = `
      SELECT 
        c.id,
        c.title,
        c.description,
        ${descriptionArSelect},
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
        ) AS students
        ${enrollmentSelect}
      FROM course c
      LEFT JOIN user u ON c.teacherId = u.id
      WHERE c.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<RowDataPacket[]>(
      sql,
      includeEnrollment ? [user?.id, normalizedCourseId] : [normalizedCourseId]
    );

    console.log('Full query result:', rows);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Course not found after full query', courseId: normalizedCourseId },
        { status: 404 }
      );
    }

    const row = rows[0];

    const course = {
      id: row.id,
      title: row.title,
      description: row.description,
      descriptionAr: row.descriptionAr || null,
      imageUrl: row.imageUrl || '/default-course.jpg',
      durationWeeks: Number(row.durationWeeks || 0),
      teacherName: row.teacherName || 'Unknown Teacher',
      teacherId: row.teacherId || null,
      price: Number(row.price || 0),
      teacherSharePct: Number(row.teacherSharePct || 0),
      status: row.status,
      createdAt: row.createdAt,
      students: Number(row.students || 0),
      enrolled: Boolean(row.enrolled),
    };

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Error fetching course:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch course',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
export async function PATCH(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:edit');
  if (authError) return authError;

  const { courseId } = await params;
  const id = decodeURIComponent(courseId).trim();

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    const isJson = contentType.includes('application/json');

    let title: string | null = null;
    let description: string | null = null;
    let teacherId: string | null = null;
    let priceStr: FormDataEntryValue | null = null;
    let durationWeeksStr: FormDataEntryValue | null = null;
    let shareStr: FormDataEntryValue | null = null;
    let statusRaw: string | null = null;
    let imageFile: File | null = null;

    if (isMultipart) {
      const formData = await req.formData();
      title = (formData.get('title') as string | null) ?? null;
      description = (formData.get('description') as string | null) ?? null;
      teacherId = (formData.get('teacherId') as string | null) ?? null;
      priceStr = formData.get('price');
      durationWeeksStr = formData.get('durationWeeks');
      shareStr = formData.get('teacherSharePct');
      statusRaw = (formData.get('status') as string | null) ?? null;
      imageFile = (formData.get('image') as File | null) ?? null;
    } else if (isJson) {
      const body = await req.json().catch(() => ({}));
      title = typeof body?.title === 'string' ? body.title : null;
      description = typeof body?.description === 'string' ? body.description : null;
      teacherId = typeof body?.teacherId === 'string' ? body.teacherId : null;
      priceStr =
        body?.price === null || body?.price === undefined ? null : String(body.price);
      durationWeeksStr =
        body?.durationWeeks === null || body?.durationWeeks === undefined
          ? null
          : String(body.durationWeeks);
      shareStr =
        body?.teacherSharePct === null || body?.teacherSharePct === undefined
          ? null
          : String(body.teacherSharePct);
      statusRaw = typeof body?.status === 'string' ? body.status : null;
      imageFile = null;
    } else {
      return NextResponse.json(
        { message: 'Unsupported content type. Use multipart/form-data or application/json' },
        { status: 415 }
      );
    }

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT imageUrl FROM course WHERE id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const oldImageUrl = existingRows[0].imageUrl as string | null;

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== null && title.trim()) {
      updates.push('title = ?');
      values.push(title.trim());
    }

    if (description !== null && description.trim()) {
      updates.push('description = ?');
      values.push(description.trim());
    }

    if (teacherId && teacherId.trim()) {
      const [teacherCheck] = await pool.query<RowDataPacket[]>(
        `
        SELECT u.id
        FROM user u
        JOIN role r ON u.roleId = r.id
        WHERE u.id = ? AND r.name = 'teacher'
        `,
        [teacherId.trim()]
      );

      if (teacherCheck.length === 0) {
        return NextResponse.json(
          { message: 'Invalid teacher ID or selected user is not a teacher' },
          { status: 400 }
        );
      }

      updates.push('teacherId = ?');
      values.push(teacherId.trim());
    }

    if (priceStr !== null) {
      const price = Number(priceStr);

      if (price < 0) {
        return NextResponse.json(
          { message: 'Price cannot be less than 0' },
          { status: 400 }
        );
      }

      updates.push('price = ?');
      values.push(price);
    }

    if (durationWeeksStr !== null) {
      const durationWeeks = Number(durationWeeksStr);

      if (durationWeeks < 1) {
        return NextResponse.json(
          { message: 'Duration must be at least 1 week' },
          { status: 400 }
        );
      }

      updates.push('durationWeeks = ?');
      values.push(durationWeeks);
    }

    if (shareStr !== null) {
      const teacherSharePct = Number(shareStr);

      if (teacherSharePct < 0 || teacherSharePct > 100) {
        return NextResponse.json(
          { message: 'Teacher share must be between 0 and 100' },
          { status: 400 }
        );
      }

      updates.push('teacherSharePct = ?');
      values.push(teacherSharePct);
    }

    if (statusRaw) {
      const validStatuses = ['draft', 'published', 'archived'];
      const finalStatus = validStatuses.includes(statusRaw) ? statusRaw : 'draft';

      updates.push('status = ?');
      values.push(finalStatus);
    }

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
      await mkdir(uploadsDir, { recursive: true });

      const extensionFromName = imageFile.name.split('.').pop()?.toLowerCase();
      const extensionFromType = imageFile.type.split('/').pop()?.toLowerCase();
      const ext = extensionFromName || extensionFromType || 'jpg';

      const safeBaseName = `course-${id}-${Date.now()}`;
      const fileName = `${safeBaseName}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await writeFile(filePath, buffer);

      const imageUrl = `/uploads/courses/${fileName}`;
      updates.push('imageUrl = ?');
      values.push(imageUrl);

      if (oldImageUrl && oldImageUrl.startsWith('/uploads/courses/')) {
        const oldImagePath = path.join(process.cwd(), 'public', oldImageUrl);

        if (fs.existsSync(oldImagePath)) {
          try {
            await unlink(oldImagePath);
          } catch (unlinkError) {
            console.error('Failed to delete old image:', unlinkError);
          }
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: 'No changes provided' },
        { status: 400 }
      );
    }

    values.push(id);

    const query = `
      UPDATE course
      SET ${updates.join(', ')}, updatedAt = NOW()
      WHERE id = ?
    `;

    let result: ResultSetHeader | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const [updateResult] = await pool.query<ResultSetHeader>(query, values);
        result = updateResult;
        break;
      } catch (error) {
        lastError = error;
        if (!isLockTimeoutError(error) || attempt === 3) {
          throw error;
        }
        await sleep(150 * attempt);
      }
    }

    if (!result) {
      throw lastError;
    }

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating course:', error);
    if (isLockTimeoutError(error)) {
      return NextResponse.json(
        {
          message: 'Course is busy right now. Please retry in a few seconds.',
          error: error.message,
          sqlMessage: error.sqlMessage,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        message: 'Failed to update course',
        error: error.message,
        sqlMessage: error.sqlMessage,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requirePermission(_req, 'course:delete');
  if (authError) return authError;

  const { courseId } = await params;
  const id = decodeURIComponent(courseId).trim();

  try {
    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT imageUrl FROM course WHERE id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const imageUrl = existingRows[0].imageUrl as string | null;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM course WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    if (imageUrl && imageUrl.startsWith('/uploads/courses/')) {
      const imagePath = path.join(process.cwd(), 'public', imageUrl);

      if (fs.existsSync(imagePath)) {
        try {
          await unlink(imagePath);
        } catch (unlinkError) {
          console.error('Failed to delete course image:', unlinkError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete course',
        error: error.message,
        sqlMessage:
          error.sqlMessage || 'Database error - check foreign key constraints',
      },
      { status: 500 }
    );
  }
}
