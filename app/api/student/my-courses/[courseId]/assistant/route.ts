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

    const maxLessons = 24;
    const trimmedLessons = lessonRows.slice(0, maxLessons);
    const contextLines = trimmedLessons.map((lesson, idx) => {
      const raw = `${lesson.title}\n${lesson.description || ''}\n${lesson.content || ''}`;
      const text = compactText(raw).slice(0, 1200);
      return `Lesson ${idx + 1} (${lesson.id}): ${text}`;
    });

    const currentLesson = lessonId
      ? trimmedLessons.find((lesson) => lesson.id === lessonId) || null
      : null;

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
      'You are a course study assistant for students in an LMS. ' +
      'Use the provided course context to answer any course-related question with a short explanation. ' +
      'For each answer, give a mini-explanation in 2-5 short sentences, simple and practical. ' +
      'If helpful, include one tiny example related to the course topic. ' +
      'If the answer is not present in context, clearly say it is not available in this course content and suggest which lesson/topic to review. ' +
      'Language rules: if preferredLanguage=ar respond only Arabic, if preferredLanguage=en respond only English. ' +
      'No admin/finance data. No hallucinations.';

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
