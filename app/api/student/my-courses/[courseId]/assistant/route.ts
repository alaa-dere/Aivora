import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

type LessonRow = RowDataPacket & {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  description: string | null;
  orderNumber: number;
};

function detectPreferredLanguage(question: string): 'ar' | 'en' {
  const text = String(question || '').toLowerCase();
  if (text.includes('english') || text.includes('in english') || text.includes('بالانجليزي')) {
    return 'en';
  }
  if (text.includes('arabic') || text.includes('in arabic') || text.includes('بالعربي') || text.includes('عربي')) {
    return 'ar';
  }
  return /[\u0600-\u06FF]/.test(question) ? 'ar' : 'en';
}

function compactText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreLessonRelevance(question: string, lesson: LessonRow): number {
  const qTokens = new Set(tokenize(question));
  if (qTokens.size === 0) return 0;
  const lessonText = compactText(`${lesson.title} ${lesson.description || ''} ${lesson.content || ''}`).slice(0, 2500);
  const lTokens = tokenize(lessonText);
  let score = 0;
  for (const token of lTokens) {
    if (qTokens.has(token)) score += 1;
  }
  return score;
}

function extractOpenAiText(data: any) {
  const outputText = String(data?.output_text || '').trim();
  if (outputText) return outputText;
  const output = Array.isArray(data?.output) ? data.output : [];
  const parts = output
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((part: any) => String(part?.text || part?.output_text || ''))
    .filter(Boolean);
  return parts.join('\n').trim();
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const id = decodeURIComponent(courseId).trim();
    const body = await req.json().catch(() => ({}));
    const question = String(body?.question || '').trim();
    const lessonId = String(body?.lessonId || '').trim();

    if (!question) {
      return NextResponse.json({ message: 'Question is required' }, { status: 400 });
    }

    const [enrollRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [id, user.id]
    );
    if (!enrollRows.length) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT title FROM course WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!courseRows.length) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const [lessonRows] = await pool.query<LessonRow[]>(
      `
      SELECT l.id, l.moduleId, l.title, l.content, l.description, l.orderNumber
      FROM lesson l
      JOIN module m ON m.id = l.moduleId
      WHERE m.courseId = ? AND l.isPublished = TRUE
      ORDER BY m.orderNumber ASC, l.orderNumber ASC
      `,
      [id]
    );

    const maxLessons = 40;
    const trimmedLessons = lessonRows.slice(0, maxLessons);
    const currentLesson = lessonId
      ? trimmedLessons.find((lesson) => lesson.id === lessonId) || null
      : null;

    const rankedLessons = [...trimmedLessons]
      .map((lesson) => ({
        lesson,
        score: scoreLessonRelevance(question, lesson) + (currentLesson?.id === lesson.id ? 1000 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.lesson);

    const contextLines = rankedLessons.map((lesson, idx) => {
      const raw = `${lesson.title}\n${lesson.description || ''}\n${lesson.content || ''}`;
      const text = compactText(raw).slice(0, 1600);
      return `Lesson ${idx + 1} (${lesson.id}): ${text}`;
    });

    const preferredLanguage = detectPreferredLanguage(question);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        source: 'rule-based',
        answer:
          preferredLanguage === 'ar'
            ? 'ميزة الذكاء الاصطناعي غير مفعلة لأن مفتاح OpenAI غير موجود. أضف OPENAI_API_KEY في ملف البيئة.'
            : 'AI is not enabled because OPENAI_API_KEY is missing. Add it in your environment file.',
      });
    }

    const model = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
    const systemPrompt =
      'You are a high-quality course tutor assistant inside an LMS. ' +
      'Answer ONLY using the provided course context and prioritize the current lesson first, then closest related lessons. ' +
      'Response quality rules: explain clearly, be practical, and include concise step-by-step guidance when applicable. ' +
      'When the student asks for troubleshooting, provide: probable cause, fix steps, and a tiny corrected example. ' +
      'When you reference content, mention the most relevant lesson title. ' +
      'If the answer is not in context, explicitly say it is not available in this course and suggest the closest lesson/topic from context. ' +
      'Language rules: if preferredLanguage=ar respond only Arabic, if preferredLanguage=en respond only English. ' +
      'No hallucinations. No unrelated policy/admin/finance content.';

    const payload = {
      preferredLanguage,
      courseTitle: String(courseRows[0].title || ''),
      currentLesson: currentLesson
        ? { id: currentLesson.id, title: currentLesson.title }
        : null,
      question,
      context: contextLines,
    };

    const openAiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
    });

    const data = await openAiRes.json();
    if (!openAiRes.ok) {
      const errorMessage = String(data?.error?.message || 'OpenAI request failed');
      return NextResponse.json(
        { message: 'AI request failed', source: 'openai', error: errorMessage },
        { status: 502 }
      );
    }

    const answer = extractOpenAiText(data);
    if (!answer) {
      return NextResponse.json(
        { message: 'AI returned empty response', source: 'openai' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      source: 'openai',
      answer,
    });
  } catch (error: any) {
    console.error('Student assistant error:', error);
    return NextResponse.json(
      { message: 'Failed to generate assistant response', error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
