import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';
import { ensureLearningPathSchema } from '@/lib/ensure-learning-path-schema';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

interface Params {
  params: Promise<{ pathId: string }>;
}

type PathLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
type PathStatus = 'draft' | 'published' | 'archived';

export async function PUT(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:edit');
  if (authError) return authError;
  await ensureLearningPathSchema();

  const { pathId } = await params;
  const id = decodeURIComponent(pathId).trim();

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
        ? parsed.filter((cid: unknown) => typeof cid === 'string' && cid.trim())
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
        ? body.courseIds.filter((courseId: unknown) => typeof courseId === 'string' && courseId.trim())
        : [];
    } else {
      return NextResponse.json({ message: 'Unsupported content type' }, { status: 415 });
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

    const [existingPathRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, imageUrl FROM learning_path WHERE id = ? LIMIT 1`,
      [id]
    );
    if (existingPathRows.length === 0) {
      return NextResponse.json({ message: 'Path not found' }, { status: 404 });
    }
    const oldImageUrl = (existingPathRows[0].imageUrl as string | null) || null;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'paths');
      await mkdir(uploadsDir, { recursive: true });
      const extensionFromName = imageFile.name.split('.').pop()?.toLowerCase();
      const extensionFromType = imageFile.type.split('/').pop()?.toLowerCase();
      const ext = extensionFromName || extensionFromType || 'jpg';
      const fileName = `path-${id}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/paths/${fileName}`;

      if (oldImageUrl && oldImageUrl.startsWith('/uploads/paths/')) {
        const oldImagePath = path.join(process.cwd(), 'public', oldImageUrl);
        if (fs.existsSync(oldImagePath)) {
          try {
            await unlink(oldImagePath);
          } catch (unlinkError) {
            console.error('Failed to delete old path image:', unlinkError);
          }
        }
      }
    }

    // Keep existing image when admin edits path without uploading a new file.
    if (!imageUrl) {
      imageUrl = oldImageUrl;
    }

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

    await conn.query<OkPacket>(
      `
      UPDATE learning_path
      SET
        categoryId = ?,
        title = ?,
        description = ?,
        imageUrl = ?,
        level = ?,
        price = ?,
        status = ?,
        estimatedHours = ?,
        updatedAt = NOW()
      WHERE id = ?
      `,
      [categoryId, title, description, imageUrl, level, price, status, estimatedHours, id]
    );

    await conn.query<ResultSetHeader>(`DELETE FROM learning_path_course WHERE pathId = ?`, [id]);

    for (let i = 0; i < uniqueCourseIds.length; i++) {
      const [idRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
      const mapId = idRows[0].id as string;

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO learning_path_course
          (id, pathId, courseId, orderNumber, isRequired, createdAt)
        VALUES
          (?, ?, ?, ?, TRUE, NOW())
        `,
        [mapId, id, uniqueCourseIds[i], i + 1]
      );
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: 'Learning path updated successfully',
    });
  } catch (error: unknown) {
    await conn.rollback();
    console.error('Error updating path:', error);
    return NextResponse.json(
      {
        message: 'Failed to update path',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const authError = await requirePermission(req, 'course:delete');
  if (authError) return authError;
  await ensureLearningPathSchema();

  const { pathId } = await params;
  const id = decodeURIComponent(pathId).trim();

  try {
    const [existingPathRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM learning_path WHERE id = ? LIMIT 1`,
      [id]
    );
    if (existingPathRows.length === 0) {
      return NextResponse.json({ message: 'Path not found' }, { status: 404 });
    }

    await pool.query<ResultSetHeader>(`DELETE FROM learning_path WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: 'Learning path deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting path:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete path',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
