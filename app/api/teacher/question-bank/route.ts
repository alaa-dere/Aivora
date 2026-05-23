import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

type QuestionRow = RowDataPacket & {
  id: string;
  moduleId: string | null;
  lessonId: string | null;
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  optionsJson: unknown;
  correctOptionIndex: number;
  createdAt: string;
};

async function assertTeacherOwnsCourse(teacherId: string, courseId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, title FROM course WHERE id = ? AND teacherId = ? LIMIT 1`,
    [courseId, teacherId]
  );
  return rows[0] as { id: string; title: string } | undefined;
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();

    const { searchParams } = new URL(req.url);
    const courseId = String(searchParams.get('courseId') || '').trim();
    const lessonId = String(searchParams.get('lessonId') || '').trim();
    const moduleId = String(searchParams.get('moduleId') || '').trim();

    if (!courseId) {
      return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
    }

    const course = await assertTeacherOwnsCourse(user.id, courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const whereSql = moduleId
      ? 'WHERE courseId = ? AND moduleId = ?'
      : lessonId
        ? 'WHERE courseId = ? AND lessonId = ?'
        : 'WHERE courseId = ?';
    const values = moduleId ? [courseId, moduleId] : lessonId ? [courseId, lessonId] : [courseId];
    const [rows] = await pool.query<QuestionRow[]>(
      `
      SELECT id, moduleId, lessonId, questionType, questionText, optionsJson, correctOptionIndex, createdAt
      FROM course_question_bank
      ${whereSql}
      ORDER BY createdAt DESC
      `,
      values
    );

    const questions = rows.map((row) => {
      let options: string[] = [];
      if (Array.isArray(row.optionsJson)) {
        options = row.optionsJson.map((item) => String(item || ''));
      } else {
        try {
          const parsed = JSON.parse(String(row.optionsJson || '[]'));
          if (Array.isArray(parsed)) {
            options = parsed.map((item) => String(item || ''));
          }
        } catch {
          options = [];
        }
      }

      return {
        id: row.id,
        moduleId: row.moduleId || null,
        lessonId: row.lessonId || null,
        questionType: row.questionType || 'multiple_choice',
        questionText: row.questionText,
        options,
        correctOptionIndex: Number(row.correctOptionIndex || 0),
        createdAt: row.createdAt,
      };
    });

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
      },
      questions,
      totalQuestions: questions.length,
    });
  } catch (error: unknown) {
    console.error('Teacher question bank GET error:', error);
    return NextResponse.json(
      {
        message: 'Failed to load question bank',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();

    const body = await req.json();
    const courseId = String(body?.courseId || '').trim();
    const moduleIdRaw = String(body?.moduleId || '').trim();
    const lessonIdRaw = String(body?.lessonId || '').trim();
    const questionTypeRaw = String(body?.questionType || 'multiple_choice').trim();
    const questionType: 'multiple_choice' | 'written' | 'true_false' =
      questionTypeRaw === 'written'
        ? 'written'
        : questionTypeRaw === 'true_false'
          ? 'true_false'
          : 'multiple_choice';
    const questionText = String(body?.questionText || '').trim();
    const optionsRaw = Array.isArray(body?.options) ? body.options : [];
    const options = optionsRaw.map((item: unknown) => String(item || '').trim()).filter(Boolean);
    const writtenAnswer = String(body?.writtenAnswer || '').trim();
    let finalOptions: string[] = [];
    let finalCorrectOptionIndex = 0;

    if (!courseId) {
      return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
    }
    if (!questionText) {
      return NextResponse.json({ message: 'Question text is required' }, { status: 400 });
    }
    if (questionType === 'written') {
      if (!writtenAnswer) {
        return NextResponse.json({ message: 'Written answer is required' }, { status: 400 });
      }
      finalOptions = [writtenAnswer];
      finalCorrectOptionIndex = 0;
    } else if (questionType === 'true_false') {
      const correctOptionIndex = Number(body?.correctOptionIndex);
      if (!Number.isInteger(correctOptionIndex) || (correctOptionIndex !== 0 && correctOptionIndex !== 1)) {
        return NextResponse.json(
          { message: 'For true/false questions, correctOptionIndex must be 0 (True) or 1 (False)' },
          { status: 400 }
        );
      }
      finalOptions = ['True', 'False'];
      finalCorrectOptionIndex = correctOptionIndex;
    } else {
      const correctOptionIndex = Number(body?.correctOptionIndex);
      if (options.length < 2) {
        return NextResponse.json(
          { message: 'At least 2 answer options are required' },
          { status: 400 }
        );
      }
      if (
        !Number.isInteger(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        return NextResponse.json(
          { message: 'correctOptionIndex is invalid' },
          { status: 400 }
        );
      }
      finalOptions = options;
      finalCorrectOptionIndex = correctOptionIndex;
    }

    const course = await assertTeacherOwnsCourse(user.id, courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    let moduleId: string | null = null;
    if (moduleIdRaw) {
      const [moduleRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM module
        WHERE id = ? AND courseId = ?
        LIMIT 1
        `,
        [moduleIdRaw, courseId]
      );
      if (moduleRows.length === 0) {
        return NextResponse.json({ message: 'Chapter not found in this course' }, { status: 400 });
      }
      moduleId = String(moduleRows[0].id);
    }

    let lessonId: string | null = null;
    if (!moduleId && lessonIdRaw) {
      const [lessonRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT l.id
        FROM lesson l
        JOIN module m ON m.id = l.moduleId
        WHERE l.id = ? AND m.courseId = ?
        LIMIT 1
        `,
        [lessonIdRaw, courseId]
      );
      if (lessonRows.length === 0) {
        return NextResponse.json({ message: 'Lesson not found in this course' }, { status: 400 });
      }
      lessonId = String(lessonRows[0].id);
    }

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const questionId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO course_question_bank
        (id, courseId, moduleId, lessonId, teacherId, questionType, questionText, optionsJson, correctOptionIndex, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        questionId,
        courseId,
        moduleId,
        lessonId,
        user.id,
        questionType,
        questionText,
        JSON.stringify(finalOptions),
        finalCorrectOptionIndex,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        question: {
          id: questionId,
          courseId,
          moduleId,
          lessonId,
          questionType,
          questionText,
          options: finalOptions,
          correctOptionIndex: finalCorrectOptionIndex,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Teacher question bank POST error:', error);
    return NextResponse.json(
      {
        message: 'Failed to save question',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
