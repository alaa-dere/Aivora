import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const authError = await requirePermission(_req, 'course:view-content');
  if (authError) return authError;

  try {
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title FROM Course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );

    if (courseRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    const [moduleRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, title, description, orderNumber
      FROM Module
      WHERE courseId = ?
      ORDER BY orderNumber ASC
      `,
      [normalizedCourseId]
    );

    const moduleIds = moduleRows.map((row) => row.id as string);
    let lessonsByModule: Record<string, any[]> = {};

    if (moduleIds.length > 0) {
      const placeholders = moduleIds.map(() => '?').join(',');
      const [lessonRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          id,
          moduleId,
          title,
          description,
          content,
          codeContent,
          videoUrl,
          orderNumber,
          durationMinutes,
          isPublished,
          type,
          enableLiveEditor
        FROM Lesson
        WHERE moduleId IN (${placeholders})
        ORDER BY orderNumber ASC
        `,
        moduleIds
      );

      lessonsByModule = lessonRows.reduce<Record<string, any[]>>((acc, row) => {
        const moduleId = row.moduleId as string;
        if (!acc[moduleId]) acc[moduleId] = [];

        acc[moduleId].push({
          id: row.id,
          title: row.title,
          type: row.type || (row.videoUrl ? 'video_embed' : 'text'),
          enableLiveEditor: Boolean(row.enableLiveEditor),
          description: row.description,
          content: row.content,
          codeContent: row.codeContent,
          videoUrl: row.videoUrl,
          orderNumber: Number(row.orderNumber || 0),
          durationMinutes: Number(row.durationMinutes || 0),
          isPublished: Boolean(row.isPublished),
        });
        return acc;
      }, {});
    }

    const modules = moduleRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      orderNumber: Number(row.orderNumber || 0),
      lessons: lessonsByModule[row.id as string] || [],
    }));

    return NextResponse.json({
      success: true,
      course: {
        id: courseRows[0].id,
        title: courseRows[0].title,
      },
      modules,
    });
  } catch (error: any) {
    console.error('Error in content API:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
