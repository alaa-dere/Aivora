import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, progressPercentage, status
      FROM enrollment
      WHERE courseId = ? AND studentId = ?
      LIMIT 1
      `,
      [id, user.id]
    );
    if (enrollRows.length === 0) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }
    const enrollment = enrollRows[0];

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title FROM course WHERE id = ? LIMIT 1`,
      [id]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const [moduleRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, title, description, orderNumber
      FROM module
      WHERE courseId = ?
      ORDER BY orderNumber ASC
      `,
      [id]
    );

    const moduleIds = moduleRows.map((row) => row.id as string);
    let lessonRows: RowDataPacket[] = [];

    if (moduleIds.length > 0) {
      const placeholders = moduleIds.map(() => '?').join(',');
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT 
          l.id,
          l.moduleId,
          l.title,
          l.description,
          l.content,
          l.videoUrl,
          l.orderNumber,
          l.durationMinutes,
          l.isPublished,
          l.type,
          l.enableLiveEditor,
          l.liveEditorLanguage,
          lp.completed AS completed
        FROM lesson l
        LEFT JOIN lessonprogress lp 
          ON lp.lessonId = l.id AND lp.enrollmentId = ?
        WHERE l.moduleId IN (${placeholders}) AND l.isPublished = TRUE
        ORDER BY l.orderNumber ASC
        `,
        [enrollRows[0].id, ...moduleIds]
      );
      lessonRows = rows;
    }

    const lessonsByModule = lessonRows.reduce<Record<string, any[]>>((acc, row) => {
      const moduleId = row.moduleId as string;
      if (!acc[moduleId]) acc[moduleId] = [];
      acc[moduleId].push({
        id: row.id,
        title: row.title,
        description: row.description,
        content: row.content,
        videoUrl: row.videoUrl,
        orderNumber: Number(row.orderNumber || 0),
        durationMinutes: Number(row.durationMinutes || 0),
        isPublished: Boolean(row.isPublished),
        type: row.type || 'text',
        enableLiveEditor: Boolean(row.enableLiveEditor),
        liveEditorLanguage: row.liveEditorLanguage || 'python',
        completed: Boolean(row.completed),
      });
      return acc;
    }, {});

    // Flatten lessons to enforce linear progression across modules
    const orderedLessons = moduleRows.flatMap((mod) => lessonsByModule[mod.id] || []);
    const unlockedLessonIds = new Set<string>();
    let unlockNext = true;
    for (const lesson of orderedLessons) {
      if (unlockNext) {
        unlockedLessonIds.add(lesson.id);
      }
      unlockNext = Boolean(lesson.completed);
    }

    const modules = moduleRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      orderNumber: Number(row.orderNumber || 0),
      lessons: (lessonsByModule[row.id] || []).map((lesson) => ({
        ...lesson,
        unlocked: unlockedLessonIds.has(lesson.id),
      })),
    }));

    const [certRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
      [user.id, id]
    );
    const certificateId = certRows[0]?.id as string | undefined;

    return NextResponse.json({
      course: {
        id: courseRows[0].id,
        title: courseRows[0].title,
        progressPercentage: Number(enrollment.progressPercentage || 0),
        status: enrollment.status,
        certificateId: certificateId || null,
      },
      modules,
    });
  } catch (error: any) {
    console.error('Student course content error:', error);
    return NextResponse.json(
      { message: 'Failed to load course content', error: error.message },
      { status: 500 }
    );
  }
}
