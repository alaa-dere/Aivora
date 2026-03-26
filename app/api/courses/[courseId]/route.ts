import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}
export async function GET(_req: Request, { params }: Params) {
  try {
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();

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

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.id,
        c.title,
        c.description,
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
      FROM course c
      LEFT JOIN user u ON c.teacherId = u.id
      WHERE c.id = ?
      LIMIT 1
      `,
      [normalizedCourseId]
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
      imageUrl: row.imageUrl || '/default-course.jpg',
      durationWeeks: Number(row.durationWeeks || 0),
      teacherName: row.teacherName || 'Unknown Teacher',
      teacherId: row.teacherId || null,
      price: Number(row.price || 0),
      teacherSharePct: Number(row.teacherSharePct || 0),
      status: row.status,
      createdAt: row.createdAt,
      students: Number(row.students || 0),
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
    const formData = await req.formData();

    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const teacherId = formData.get('teacherId') as string | null;
    const priceStr = formData.get('price');
    const durationWeeksStr = formData.get('durationWeeks');
    const shareStr = formData.get('teacherSharePct');
    const statusRaw = formData.get('status') as string | null;
    const imageFile = formData.get('image') as File | null;

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

    if (teacherId) {
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

      updates.push('teacherId = ?');
      values.push(teacherId);
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

    const [result] = await pool.query<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating course:', error);
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
