type JsonObject = Record<string, unknown>;

export type AdminChatbotDebug = {
  provider: 'openai' | 'none';
  status?: number;
  code?: string;
  message?: string;
};

export type AdminChatbotAiResponse =
  | {
      ok: true;
      source: 'openai';
      answer: string;
      suggestedQuestions: string[];
    }
  | {
      ok: false;
      debug: AdminChatbotDebug;
    };

type AdminChatbotPayload = {
  question: string;
  preferredLanguage: 'ar' | 'en';
  context: {
    targetMonth: string;
    monthLabel: string;
    monthlyRevenue: number;
    monthlyRevenueHistory: Array<{ month: string; revenue: number }>;
    totalStudents: number;
    totalTeachers: number;
    totalPublishedCourses: number;
    topTeacher: { name: string; revenue: number } | null;
    topCourse: { title: string; revenue: number } | null;
    mostActiveStudents: Array<{
      fullName: string;
      activityScore: number;
      completedLessons: number;
      quizAttempts: number;
      attendedSessions: number;
    }>;
    analytics: Record<string, unknown>;
  };
};

function asObject(value: unknown): JsonObject {
  if (value && typeof value === 'object') return value as JsonObject;
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractOpenAiText(data: unknown) {
  const obj = asObject(data);
  const outputText = String(obj.output_text || '').trim();
  if (outputText) return outputText;

  const output = asArray(obj.output);
  const parts = output
    .flatMap((item) => asArray(asObject(item).content))
    .map((contentPart) => {
      const partObj = asObject(contentPart);
      return String(partObj.text || partObj.output_text || '');
    })
    .filter(Boolean);

  return parts.join('\n').trim();
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

function parseChatbotResponse(parsed: unknown) {
  const obj = asObject(parsed);
  const answer = String(obj.answer || '').trim();
  const suggestedQuestions = asArray(obj.suggestedQuestions)
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!answer) return null;
  return {
    answer,
    suggestedQuestions,
  };
}

export async function generateAdminChatbotReply(
  payload: AdminChatbotPayload
): Promise<AdminChatbotAiResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, debug: { provider: 'none', message: 'Missing OPENAI_API_KEY' } };
  }

  const preferredModel = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
  const fallbackModel = (process.env.OPENAI_FALLBACK_MODEL || 'gpt-5.1').trim();
  const modelCandidates = Array.from(new Set([preferredModel, fallbackModel, 'gpt-5-mini', 'gpt-5.1']));
  const attempts: string[] = [];

  const systemPrompt =
    'You are an admin analytics assistant for an LMS platform. ' +
    'The response language must strictly match preferredLanguage: ar or en. ' +
    'If preferredLanguage is ar, respond only in Arabic. If en, respond only in English. ' +
    'Use only the provided context numbers. Do not invent data. ' +
    'If a requested metric is unavailable, say clearly that it is not available in current data. ' +
    'You can answer finance, academic, predictive-risk, sentiment, and executive summary questions based on context.analytics. ' +
    'For predictive questions, provide probability/likelihood as reasoned estimate from available trends, and label it as estimate. ' +
    'Keep answers concise and directly actionable. ' +
    'Return JSON only with keys: answer, suggestedQuestions. ' +
    'suggestedQuestions must be an array of up to 3 short follow-up questions.';

  for (const model of modelCandidates) {
    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: JSON.stringify(payload),
            },
          ],
        }),
      });

      const data: unknown = await res.json();
      const dataObj = asObject(data);
      if (!res.ok) {
        const errorObj = asObject(dataObj.error);
        attempts.push(`${model}: ${String(errorObj.message || 'OpenAI request failed')}`);
        continue;
      }

      const text = extractOpenAiText(data);
      const parsed = parseChatbotResponse(extractJsonObject(text));
      if (!parsed) {
        attempts.push(`${model}: OpenAI returned invalid chatbot JSON`);
        continue;
      }

      return {
        ok: true,
        source: 'openai',
        answer: parsed.answer,
        suggestedQuestions: parsed.suggestedQuestions,
      };
    } catch (error) {
      attempts.push(`${model}: ${error instanceof Error ? error.message : 'OpenAI request failed'}`);
    }
  }

  return {
    ok: false,
    debug: {
      provider: 'openai',
      status: 502,
      message: attempts.length ? attempts.join(' | ') : 'OpenAI request failed',
    },
  };
}
