import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { generateAiInsights } from '@/lib/ai-insights-provider';

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
    const { searchParams } = new URL(req.url);
    const month = String(searchParams.get('month') || '').trim();
    const validMonth = /^\d{4}-\d{2}$/.test(month);
    const monthFilter = validMonth
      ? "AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?"
      : "AND ft.transactionDate >= DATE_SUB(NOW(), INTERVAL 120 DAY)";
    const queryParams: string[] = validMonth ? [month] : [];

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
        ${monthFilter}
      ORDER BY ft.transactionDate DESC
      `
      ,
      queryParams
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

      const includeInTopCourses = validMonth
        ? String(item.transactionDate).slice(0, 7) === month
        : date >= thirtyDaysAgo;

      if (includeInTopCourses && item.courseTitle) {
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
let aiDebug: { provider: 'openai' | 'none'; status?: number; code?: string; message?: string } | null =
  null;

const aiResult = await generateAiInsights({
  last8Weeks: last8,
  last4Total,
  prev4Total,
  weeklyAvg,
  trendPct,
  topCourses,
  ruleBased: { forecastMonthly, trendPct, insights },
});

if (aiResult.ok) {
  finalForecast = Number(aiResult.forecastMonthly || finalForecast);
  finalTrend = Number(aiResult.trendPct || finalTrend);
  finalInsights = aiResult.insights;
  source = aiResult.source;
} else {
  aiDebug = aiResult.debug;
}

return NextResponse.json({
  forecastMonthly: finalForecast,
  trendPct: finalTrend,
  last4Total,
  prev4Total,
  topCourses,
  insights: finalInsights,
  source,
  aiDebug,
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

