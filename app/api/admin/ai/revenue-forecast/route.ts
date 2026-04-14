import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type TxRow = {
  transactionDate: string;
  amount: number;
  courseId?: string | null;
  courseTitle?: string | null;
};

type CourseAgg = { title: string; revenue: number; count: number };

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        ft.transactionDate,
        ft.amount,
        ft.courseId,
        c.title AS courseTitle
      FROM finance_transaction ft
      LEFT JOIN course c ON c.id = ft.courseId
      WHERE ft.status = 'success'
        AND ft.type = 'enrollment'
        AND ft.transactionDate >= DATE_SUB(NOW(), INTERVAL 120 DAY)
      ORDER BY ft.transactionDate DESC
      `
    );

    const tx = rows.map((row) => ({
      transactionDate: String(row.transactionDate),
      amount: Number(row.amount || 0),
      courseId: row.courseId ? String(row.courseId) : null,
      courseTitle: row.courseTitle ? String(row.courseTitle) : null,
    })) as TxRow[];

    const weeklyMap = new Map<string, number>();
    const courseMap = new Map<string, CourseAgg>();
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    for (const item of tx) {
      const date = new Date(item.transactionDate);
      if (Number.isNaN(date.getTime())) continue;

      const weekStart = startOfWeek(date);
      const key = toKey(weekStart);
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + item.amount);

      if (date >= thirtyDaysAgo && item.courseTitle) {
        const prev = courseMap.get(item.courseTitle) || {
          title: item.courseTitle,
          revenue: 0,
          count: 0,
        };
        prev.revenue += item.amount;
        prev.count += 1;
        courseMap.set(item.courseTitle, prev);
      }
    }

    const weeks = Array.from(weeklyMap.entries())
      .map(([week, revenue]) => ({ week, revenue }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const last8 = weeks.slice(-8);
    const last4 = last8.slice(-4);
    const prev4 = last8.slice(0, Math.max(0, last8.length - 4));

    const sum = (list: { revenue: number }[]) =>
      list.reduce((acc, cur) => acc + Number(cur.revenue || 0), 0);

    const last4Total = sum(last4);
    const prev4Total = sum(prev4);
    const weeklyAvg = last4.length ? last4Total / last4.length : 0;
    const trendPct = prev4Total > 0 ? (last4Total - prev4Total) / prev4Total : 0;
    const trendAdj = 1 + Math.max(-0.25, Math.min(0.25, trendPct * 0.5));
    const forecastMonthly = weeklyAvg * 4 * trendAdj;

    const topCourses = Array.from(courseMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    const topCourse = topCourses[0];
    const topCourseShare =
      topCourse && last4Total > 0 ? Math.round((topCourse.revenue / last4Total) * 100) : 0;

    const insights = [
  {
    type: 'forecast',
    title: 'Forecast',
  description: `Projected next-month revenue: $${forecastMonthly.toFixed(0)}`,
  },
  {
    type: 'trend',
    title: trendPct >= 0 ? 'Growth' : 'Slowdown',
    description: `Last 4 weeks ${trendPct >= 0 ? 'up' : 'down'} ${Math.abs(
      Math.round(trendPct * 100)
    )}% vs previous 4 weeks.`,
  },
  {
    type: 'recommendation',
    title: 'Recommendation',
    description: topCourse
      ? `Focus on "${topCourse.title}" - it drives ${topCourseShare}% of recent revenue.`
      : 'Increase enrollments with promo campaigns on top-performing courses.',
  },
];

let source: 'rule-based' | 'openai' = 'rule-based';
let finalForecast = forecastMonthly;
let finalTrend = trendPct;
let finalInsights = insights;
let openaiDebug: { status?: number; code?: string; message?: string } | null = null;

const openaiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4.1';

if (!openaiKey) {
  return NextResponse.json(
    {
      message: 'OpenAI API key is required to generate AI insights.',
      source: 'openai',
      openaiDebug: { message: 'Missing OPENAI_API_KEY' },
    },
    { status: 400 }
  );
}

const jsonSchema = {
  name: 'ai_insights',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      forecastMonthly: { type: 'number' },
      trendPct: { type: 'number' },
      insights: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['type', 'title', 'description'],
        },
      },
    },
    required: ['forecastMonthly', 'trendPct', 'insights'],
  },
};

const extractOutputText = (data: any) => {
  if (typeof data?.output_text === 'string') return data.output_text;
  const fromOutput =
    data?.output
      ?.flatMap((item: any) => item.content || [])
      ?.find((item: any) => item.type === 'output_text')?.text || '';
  if (fromOutput) return fromOutput;
  return data?.output?.[0]?.content?.[0]?.text || '';
};

try {
  const payload = {
    model,
    text: { format: { type: 'json_schema', name: jsonSchema.name, schema: jsonSchema.schema } },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              'You are a data analyst for an education platform. ' +
              'Return JSON only with keys: forecastMonthly, trendPct, insights. ' +
              'insights must be an array of 3 items with type, title, description. ' +
              'Use USD amounts without commas and keep descriptions short.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify({
              last8Weeks: last8,
              last4Total,
              prev4Total,
              weeklyAvg,
              trendPct,
              topCourses,
              ruleBased: { forecastMonthly, trendPct, insights },
            }),
          },
        ],
      },
    ],
  };

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const outputText = extractOutputText(data);

  if (res.ok && outputText) {
    try {
      const parsed = JSON.parse(outputText);
      if (parsed && Array.isArray(parsed.insights)) {
        finalForecast = Number(parsed.forecastMonthly || finalForecast);
        finalTrend = Number(parsed.trendPct || finalTrend);
        finalInsights = parsed.insights;
        source = 'openai';
      } else {
        openaiDebug = { message: 'OpenAI returned invalid insights shape' };
      }
    } catch {
      openaiDebug = { message: 'OpenAI returned non-JSON output' };
    }
  } else if (!res.ok) {
    openaiDebug = {
      status: res.status,
      code: data?.error?.code,
      message: data?.error?.message || 'OpenAI request failed',
    };
  }
} catch (error) {
  console.error('OpenAI forecast error:', error);
  openaiDebug = { message: error instanceof Error ? error.message : 'OpenAI request failed' };
}

if (source !== 'openai') {
  return NextResponse.json(
    {
      message: 'OpenAI did not return valid insights.',
      source: 'openai',
      openaiDebug,
    },
    { status: 502 }
  );
}

return NextResponse.json({
  forecastMonthly: finalForecast,
  trendPct: finalTrend,
  last4Total,
  prev4Total,
  topCourses,
  insights: finalInsights,
  source,
  openaiDebug,
});
  } catch (error: unknown) {
    console.error('AI revenue forecast error:', error);
    return NextResponse.json(
      {
        message: 'Failed to generate forecast',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

