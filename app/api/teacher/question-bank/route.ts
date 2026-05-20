import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

type QuestionRow = RowDataPacket & {
  id: string;
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

    if (!courseId) {
      return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
    }

    const course = await assertTeacherOwnsCourse(user.id, courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const [rows] = await pool.query<QuestionRow[]>(
      `
      SELECT id, questionType, questionText, optionsJson, correctOptionIndex, createdAt
      FROM course_question_bank
      WHERE courseId = ?
      ORDER BY createdAt DESC
      `,
      [courseId]
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

    const [idRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
    const questionId = idRows[0].id as string;

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO course_question_bank
        (id, courseId, teacherId, questionType, questionText, optionsJson, correctOptionIndex, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        questionId,
        courseId,
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
