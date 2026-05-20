import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/request-auth';

type AiDraft = {
  title: string;
  description: string;
  durationWeeks: number;
  price: number;
  teacherSharePct: number;
  status: 'draft' | 'published' | 'archived';
};

function extractOpenAiText(data: unknown): string {
  const root = (data || {}) as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof root.output_text === 'string' && root.output_text.trim()) {
    return root.output_text.trim();
  }

  if (Array.isArray(root.output)) {
    const chunks: string[] = [];
    for (const item of root.output) {
      for (const content of item?.content || []) {
        if (content?.type === 'output_text' && typeof content.text === 'string') {
          chunks.push(content.text);
        }
      }
    }
    return chunks.join('\n').trim();
  }

  return '';
}

function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const raw = text.slice(start, end + 1);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeDraft(parsed: unknown): AiDraft | null {
  const obj = (parsed || {}) as Partial<AiDraft>;
  if (!obj || typeof obj !== 'object') return null;
  const title = String(obj.title || '').trim();
  const description = String(obj.description || '').trim();
  if (!title || !description) return null;

  const durationWeeks = Math.max(1, Number(obj.durationWeeks || 4));
  const price = Math.max(0, Number(obj.price || 0));
  const teacherSharePct = Math.min(100, Math.max(0, Number(obj.teacherSharePct || 70)));
  const status: AiDraft['status'] =
    obj.status === 'published' || obj.status === 'archived' ? obj.status : 'draft';

  return {
    title,
    description,
    durationWeeks: Number.isFinite(durationWeeks) ? durationWeeks : 4,
    price: Number.isFinite(price) ? price : 0,
    teacherSharePct: Number.isFinite(teacherSharePct) ? teacherSharePct : 70,
    status,
  };
}

function fallbackDraft(prompt: string): AiDraft {
  const cleanPrompt = prompt.trim() || 'Programming Course';
  const title =
    cleanPrompt.length > 80 ? `${cleanPrompt.slice(0, 77).trim()}...` : cleanPrompt;
  return {
    title,
    description:
      `A practical course about ${cleanPrompt}. ` +
      `Students will learn the fundamentals, build hands-on projects, and finish with real-world skills.`,
    durationWeeks: 6,
    price: 59,
    teacherSharePct: 70,
    status: 'draft',
  };
}

export async function POST(req: Request) {
  const authError = await requirePermission(req, 'course:create');
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        draft: fallbackDraft(prompt),
      });
    }

    const model = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
    const instruction =
      'Return JSON only with keys: title, description, durationWeeks, price, teacherSharePct, status. ' +
      "status must be one of: draft, published, archived. Keep description 2-4 sentences, practical and clear.";

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: instruction },
          { role: 'user', content: `Generate a course draft for this idea: ${prompt}` },
        ],
      }),
    });

    const data: unknown = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        draft: fallbackDraft(prompt),
      });
    }

    const text = extractOpenAiText(data);
    const parsed = normalizeDraft(extractJsonObject(text));
    if (!parsed) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        draft: fallbackDraft(prompt),
      });
    }

    return NextResponse.json({ success: true, source: 'openai', draft: parsed });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: true,
        source: 'fallback',
        draft: fallbackDraft('Programming Course'),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

