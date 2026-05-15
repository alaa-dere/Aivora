import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

interface Params {
  params: Promise<{ courseId: string }>;
}

function normalizeLessonContent(content: string | null) {
  if (!content) return content;
  return content
    .replace(/\\`/g, '`')
    .replace(
      /```[ \t]*([a-zA-Z0-9_+-]+)[ \t]*\r?\n([\s\S]*?)```/g,
      (_match, _lang, codeBody: string) => `\`\`\`${codeBody}\`\`\``
    );
}

export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();
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
      `SELECT id, title, imageUrl FROM course WHERE id = ? LIMIT 1`,
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
    let quizQuestionsByLesson: Record<string, any[]> = {};

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

      const lessonIds = lessonRows.map((row) => String(row.id)).filter(Boolean);
      if (lessonIds.length > 0) {
        const lessonPlaceholders = lessonIds.map(() => '?').join(',');
        const [questionRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT id, lessonId, questionType, questionText, optionsJson, correctOptionIndex
          FROM course_question_bank
          WHERE courseId = ? AND lessonId IN (${lessonPlaceholders})
          ORDER BY createdAt ASC
          `,
          [id, ...lessonIds]
        );

        quizQuestionsByLesson = questionRows.reduce<Record<string, any[]>>((acc, row) => {
          const lessonId = String(row.lessonId || '');
          if (!lessonId) return acc;
          if (!acc[lessonId]) acc[lessonId] = [];

          let options: string[] = [];
          if (Array.isArray(row.optionsJson)) {
            options = row.optionsJson.map((x: unknown) => String(x || ''));
          } else if (typeof row.optionsJson === 'string') {
            try {
              const parsed = JSON.parse(row.optionsJson);
              if (Array.isArray(parsed)) {
                options = parsed.map((x) => String(x || ''));
              }
            } catch {
              options = [];
            }
          }

          acc[lessonId].push({
            id: row.id,
            questionType: row.questionType || 'multiple_choice',
            questionText: row.questionText,
            options,
            correctOptionIndex:
              row.correctOptionIndex === null || row.correctOptionIndex === undefined
                ? undefined
                : Number(row.correctOptionIndex),
          });

          return acc;
        }, {});
      }
    }

    const lessonsByModule = lessonRows.reduce<Record<string, any[]>>((acc, row) => {
      const moduleId = row.moduleId as string;
      if (!acc[moduleId]) acc[moduleId] = [];
      acc[moduleId].push({
        id: row.id,
        title: row.title,
        description: row.description,
        content: normalizeLessonContent(row.content ? String(row.content) : null),
        videoUrl: row.videoUrl,
        orderNumber: Number(row.orderNumber || 0),
        durationMinutes: Number(row.durationMinutes || 0),
        isPublished: Boolean(row.isPublished),
        type: row.type || 'text',
        enableLiveEditor: Boolean(row.enableLiveEditor),
        liveEditorLanguage: row.liveEditorLanguage || 'python',
        completed: Boolean(row.completed),
        quizQuestions: quizQuestionsByLesson[String(row.id)] || [],
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

    const [lastActiveRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT lp.lessonId
      FROM lessonprogress lp
      JOIN lesson l ON l.id = lp.lessonId
      JOIN module m ON m.id = l.moduleId
      WHERE lp.enrollmentId = ? AND m.courseId = ?
      ORDER BY COALESCE(lp.completedAt, lp.startedAt) DESC, lp.id DESC
      LIMIT 1
      `,
      [enrollment.id, id]
    );
    const lastActiveLessonId = (lastActiveRows[0]?.lessonId as string | undefined) || null;

    const [certRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM certificate WHERE studentId = ? AND courseId = ? LIMIT 1`,
      [user.id, id]
    );
    const certificateId = certRows[0]?.id as string | undefined;

    return NextResponse.json({
      course: {
        id: courseRows[0].id,
        title: courseRows[0].title,
        imageUrl: courseRows[0].imageUrl || '/default-course.jpg',
        progressPercentage: Number(enrollment.progressPercentage || 0),
        status: enrollment.status,
        lastActiveLessonId,
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
