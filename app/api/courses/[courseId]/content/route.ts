import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requirePermission } from '@/lib/request-auth';
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

export async function GET(_req: Request, { params }: Params) {
  const authError = await requirePermission(_req, 'course:view-content');
  if (authError) return authError;

  try {
    await ensureCourseQuizSchema();
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title FROM course WHERE id = ? LIMIT 1`,
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
      FROM module
      WHERE courseId = ?
      ORDER BY orderNumber ASC
      `,
      [normalizedCourseId]
    );

    const moduleIds = moduleRows.map((row) => row.id as string);
    let lessonsByModule: Record<string, any[]> = {};
    let quizQuestionsByLesson: Record<string, any[]> = {};

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
          enableLiveEditor,
          liveEditorLanguage
        FROM lesson
        WHERE moduleId IN (${placeholders})
        ORDER BY orderNumber ASC
        `,
        moduleIds
      );

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
          [normalizedCourseId, ...lessonIds]
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

      lessonsByModule = lessonRows.reduce<Record<string, any[]>>((acc, row) => {
        const moduleId = row.moduleId as string;
        if (!acc[moduleId]) acc[moduleId] = [];

        acc[moduleId].push({
          id: row.id,
          title: row.title,
          type: row.type || (row.videoUrl ? 'video_embed' : 'text'),
          enableLiveEditor: Boolean(row.enableLiveEditor),
          liveEditorLanguage: row.liveEditorLanguage || 'python',
          description: row.description,
          content: normalizeLessonContent(row.content ? String(row.content) : null),
          codeContent: row.codeContent,
          videoUrl: row.videoUrl,
          orderNumber: Number(row.orderNumber || 0),
          durationMinutes: Number(row.durationMinutes || 0),
          isPublished: Boolean(row.isPublished),
          quizQuestions: quizQuestionsByLesson[String(row.id)] || [],
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
