import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

type GeneratedQuestion = {
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  writtenAnswer?: string;
};

function safeString(value: unknown) {
  return String(value ?? '').trim();
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractJsonObject(text: string) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function extractOpenAiText(data: unknown) {
  const obj = asObject(data);
  const outputText = safeString(obj.output_text);
  if (outputText) return outputText;

  const output = asArray(obj.output);
  const parts = output
    .flatMap((item) => asArray(asObject(item).content))
    .map((part) => {
      const p = asObject(part);
      return safeString(p.text || p.output_text);
    })
    .filter(Boolean);

  return parts.join('\n').trim();
}

function normalizeQuestions(input: unknown): GeneratedQuestion[] {
  const obj = asObject(input);
  const items = asArray(obj.questions)
    .map((item) => {
      const q = asObject(item);
      const rawType = safeString(q.questionType).toLowerCase();
      const questionType: GeneratedQuestion['questionType'] =
        rawType === 'written'
          ? 'written'
          : rawType === 'true_false' || rawType === 'true/false'
            ? 'true_false'
            : 'multiple_choice';

      const questionText = safeString(q.questionText);
      const options = asArray(q.options).map((opt) => safeString(opt)).filter(Boolean);
      const writtenAnswer = safeString(q.writtenAnswer);
      const correctOptionIndex = Number(q.correctOptionIndex);

      if (!questionText) return null;

      if (questionType === 'written') {
        if (!writtenAnswer) return null;
        return {
          questionType,
          questionText,
          options: [writtenAnswer],
          correctOptionIndex: 0,
          writtenAnswer,
        };
      }

      if (questionType === 'true_false') {
        const idx = correctOptionIndex === 1 ? 1 : 0;
        return {
          questionType,
          questionText,
          options: ['True', 'False'],
          correctOptionIndex: idx,
        };
      }

      if (options.length < 2) return null;
      const idx = Number.isInteger(correctOptionIndex) && correctOptionIndex >= 0 && correctOptionIndex < options.length
        ? correctOptionIndex
        : 0;
      return {
        questionType,
        questionText,
        options,
        correctOptionIndex: idx,
      };
    })
    .filter(Boolean) as GeneratedQuestion[];

  return items.slice(0, 20);
}

async function assertTeacherOwnsCourse(teacherId: string, courseId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, title, description FROM course WHERE id = ? AND teacherId = ? LIMIT 1`,
    [courseId, teacherId]
  );
  return rows[0] as { id: string; title: string; description?: string | null } | undefined;
}

async function callOpenAiForQuestions(input: {
  courseTitle: string;
  courseDescription: string;
  contentText: string;
  count: number;
  language: 'ar' | 'en';
  difficulty: 'easy' | 'medium' | 'hard';
  mix: { mcqPct: number; trueFalsePct: number; writtenPct: number };
}): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const model = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
  const prompt =
    'Generate high-quality quiz questions for a teacher question bank. ' +
    'Return JSON only with shape: {"questions":[{"questionType","questionText","options","correctOptionIndex","writtenAnswer"}]}. ' +
    'Allowed questionType values: multiple_choice, true_false, written. ' +
    'For multiple_choice provide 4 options and exactly one correct option index. ' +
    'For true_false use options True/False and correctOptionIndex 0 or 1. ' +
    'For written provide writtenAnswer. Avoid duplicates and keep questions answerable from content. ' +
    'Respect requested language, difficulty, and type distribution as much as possible.';

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: JSON.stringify({
            count: input.count,
            courseTitle: input.courseTitle,
            courseDescription: input.courseDescription,
            content: input.contentText,
            language: input.language,
            difficulty: input.difficulty,
            distribution: {
              multiple_choice_percent: input.mix.mcqPct,
              true_false_percent: input.mix.trueFalsePct,
              written_percent: input.mix.writtenPct,
            },
          }),
        },
      ],
    }),
  });

  const data: unknown = await res.json();
  if (!res.ok) {
    const errorObj = asObject(asObject(data).error);
    throw new Error(safeString(errorObj.message) || 'OpenAI request failed');
  }

  const text = extractOpenAiText(data);
  const parsed = extractJsonObject(text);
  const questions = normalizeQuestions(parsed);
  if (questions.length === 0) {
    throw new Error('AI returned no valid questions');
  }
  return questions;
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureCourseQuizSchema();
    const body = await req.json();
    const courseId = safeString(body?.courseId);
    const requestedCount = Number(body?.count || 5);
    const count = Number.isInteger(requestedCount) ? Math.min(20, Math.max(1, requestedCount)) : 5;
    const language = safeString(body?.language).toLowerCase() === 'ar' ? 'ar' : 'en';
    const difficultyRaw = safeString(body?.difficulty).toLowerCase();
    const difficulty: 'easy' | 'medium' | 'hard' =
      difficultyRaw === 'easy' || difficultyRaw === 'hard' ? difficultyRaw : 'medium';
    const mcqPct = Math.max(0, Number(body?.distribution?.mcqPct ?? 60));
    const trueFalsePct = Math.max(0, Number(body?.distribution?.trueFalsePct ?? 20));
    const writtenPct = Math.max(0, Number(body?.distribution?.writtenPct ?? 20));
    const totalPct = mcqPct + trueFalsePct + writtenPct || 1;
    const mix = {
      mcqPct: Math.round((mcqPct / totalPct) * 100),
      trueFalsePct: Math.round((trueFalsePct / totalPct) * 100),
      writtenPct: Math.max(0, 100 - Math.round((mcqPct / totalPct) * 100) - Math.round((trueFalsePct / totalPct) * 100)),
    };

    if (!courseId) {
      return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
    }

    const course = await assertTeacherOwnsCourse(user.id, courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        m.title AS moduleTitle,
        m.description AS moduleDescription,
        l.title AS lessonTitle,
        l.description AS lessonDescription,
        l.content AS lessonContent,
        l.codeContent AS lessonCode
      FROM module m
      LEFT JOIN lesson l ON l.moduleId = m.id
      WHERE m.courseId = ?
      ORDER BY m.orderNumber ASC, l.orderNumber ASC
      `,
      [courseId]
    );

    const chunks: string[] = [];
    if (course.description) chunks.push(`Course description: ${safeString(course.description)}`);
    rows.forEach((row, idx) => {
      const segment = [
        `Section #${idx + 1}`,
        `Module: ${safeString(row.moduleTitle)}`,
        `Module Description: ${safeString(row.moduleDescription)}`,
        `Lesson: ${safeString(row.lessonTitle)}`,
        `Lesson Description: ${safeString(row.lessonDescription)}`,
        `Lesson Content: ${safeString(row.lessonContent)}`,
        `Code Snippet: ${safeString(row.lessonCode)}`,
      ]
        .filter(Boolean)
        .join('\n');
      if (segment.trim()) chunks.push(segment);
    });

    const contentText = chunks.join('\n\n').slice(0, 12000);
    if (!contentText.trim()) {
      return NextResponse.json(
        { message: 'No course content available to generate questions from. Please add lessons/content first.' },
        { status: 400 }
      );
    }

    const generated = await callOpenAiForQuestions({
      courseTitle: course.title,
      courseDescription: safeString(course.description),
      contentText,
      count,
      language,
      difficulty,
      mix,
    });

    return NextResponse.json({
      success: true,
      source: 'openai',
      generatedCount: generated.length,
      settings: { language, difficulty, distribution: mix },
      questions: generated,
    });
  } catch (error: unknown) {
    console.error('Teacher question bank AI generate error:', error);
    return NextResponse.json(
      {
        message: 'Failed to generate AI questions',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
