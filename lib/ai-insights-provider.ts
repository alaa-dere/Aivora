type Insight = {
  type: string;
  title: string;
  description: string;
};

type JsonObject = Record<string, unknown>;

type AiInsightsPayload = {
  last8Weeks: { week: string; revenue: number }[];
  last4Total: number;
  prev4Total: number;
  weeklyAvg: number;
  trendPct: number;
  topCourses: { title: string; revenue: number; count: number }[];
  ruleBased: {
    forecastMonthly: number;
    trendPct: number;
    insights: Insight[];
  };
};

export type AiInsightsSource = 'openai';

export type AiInsightsDebug = {
  provider: AiInsightsSource | 'none';
  status?: number;
  code?: string;
  message?: string;
};

export type AiInsightsResponse =
  | {
      ok: true;
      source: AiInsightsSource;
      forecastMonthly: number;
      trendPct: number;
      insights: Insight[];
    }
  | {
      ok: false;
      debug: AiInsightsDebug;
    };

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

function asObject(value: unknown): JsonObject {
  if (value && typeof value === 'object') return value as JsonObject;
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeInsights(parsed: unknown) {
  const parsedObj = asObject(parsed) as {
    insights?: unknown[];
    forecastMonthly?: unknown;
    trendPct?: unknown;
  };
  if (!Array.isArray(parsedObj.insights)) return null;

  const insights = parsedObj.insights
    .map((item) => {
      const itemObj = asObject(item);
      return {
        type: String(itemObj.type || ''),
        title: String(itemObj.title || ''),
        description: String(itemObj.description || ''),
      };
    })
    .filter((item: Insight) => item.type && item.title && item.description)
    .slice(0, 3);

  if (insights.length !== 3) return null;

  return {
    forecastMonthly: Number(parsedObj.forecastMonthly),
    trendPct: Number(parsedObj.trendPct),
    insights,
  };
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

async function callOpenAi(payload: AiInsightsPayload): Promise<AiInsightsResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, debug: { provider: 'openai', message: 'Missing OPENAI_API_KEY' } };
  }

  const preferredModel = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
  const fallbackModel = (process.env.OPENAI_FALLBACK_MODEL || 'gpt-5.1').trim();
  const modelCandidates = Array.from(
    new Set([preferredModel, fallbackModel, 'gpt-5-mini', 'gpt-5.1'])
  );
  const prompt =
    'You are a data analyst for an education platform. ' +
    'Return JSON only with keys: forecastMonthly, trendPct, insights. ' +
    'insights must be an array of exactly 3 objects with keys: type, title, description. ' +
    'Use USD amounts without commas and keep descriptions short.';

  const attempts: string[] = [];

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
              role: 'user',
              content: `${prompt}\n\nData:\n${JSON.stringify(payload)}`,
            },
          ],
        }),
      });

      const data: unknown = await res.json();
      const dataObj = asObject(data);

      if (!res.ok) {
        const errorObj = asObject(dataObj.error);
        attempts.push(
          `${model}: ${String(errorObj.message || 'OpenAI request failed')}`
        );
        continue;
      }

      const text = extractOpenAiText(data);
      const parsed = normalizeInsights(extractJsonObject(text));

      if (!parsed) {
        attempts.push(`${model}: OpenAI returned invalid JSON insights shape`);
        continue;
      }

      return { ok: true, source: 'openai', ...parsed };
    } catch (error) {
      attempts.push(
        `${model}: ${error instanceof Error ? error.message : 'OpenAI request failed'}`
      );
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

export async function generateAiInsights(payload: AiInsightsPayload): Promise<AiInsightsResponse> {
  const openAiResult = await callOpenAi(payload);
  if (openAiResult.ok) return openAiResult;

  const missingKey = openAiResult.debug.message === 'Missing OPENAI_API_KEY';
  if (missingKey) {
    return {
      ok: false,
      debug: {
        provider: 'none',
        message: 'Missing OPENAI_API_KEY',
      },
    };
  }

  return { ok: false, debug: openAiResult.debug };
}
