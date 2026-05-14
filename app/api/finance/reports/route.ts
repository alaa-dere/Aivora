import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { generateAiInsights } from '@/lib/ai-insights-provider';

type SumRow = RowDataPacket & { total: number };
type CountRow = RowDataPacket & { count: number; type: string };
type TxInsightRow = RowDataPacket & {
  transactionDate: string;
  amount: number;
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
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '';

    const params: Array<string> = [];
    const monthFilter = month ? "AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?" : '';
    if (month) {
      params.push(month);
    }

    const [incomeRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.amount), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.amount > 0
          ${monthFilter}
      `,
      params
    );

    const [teacherRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.teacherShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
      `,
      params
    );

    const [platformRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.platformShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
      `,
      params
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT ft.type, COUNT(*) AS count
        FROM finance_transaction ft
        WHERE 1=1
          ${monthFilter}
        GROUP BY ft.type
      `,
      params
    );

    const [totalRows] = await pool.query<SumRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM finance_transaction ft
        WHERE 1=1
          ${monthFilter}
      `,
      params
    );

    const byType: Record<string, number> = {};
    for (const row of countRows) {
      byType[row.type] = Number(row.count || 0);
    }

    const [txRows] = await pool.query<TxInsightRow[]>(
      `
        SELECT
          ft.transactionDate,
          ft.amount,
          c.title AS courseTitle
        FROM finance_transaction ft
        LEFT JOIN course c ON c.id = ft.courseId
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
        ORDER BY ft.transactionDate DESC
      `,
      params
    );

    const tx = txRows.map((row) => ({
      transactionDate: String(row.transactionDate),
      amount: Number(row.amount || 0),
      courseTitle: row.courseTitle ? String(row.courseTitle) : null,
    }));

    const weeklyMap = new Map<string, number>();
    const courseMap = new Map<string, CourseAgg>();

    for (const item of tx) {
      const date = new Date(item.transactionDate);
      if (Number.isNaN(date.getTime())) continue;

      const key = toKey(startOfWeek(date));
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + item.amount);

      if (item.courseTitle) {
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

    const ruleInsights = [
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

    let aiSource: 'openai' | 'rule-based' = 'rule-based';
    let aiForecast = Number.isFinite(forecastMonthly) ? forecastMonthly : Number(incomeRows[0]?.total || 0);
    let aiTrendText = ruleInsights[1].description;
    let aiDebug: { provider: 'openai' | 'none'; status?: number; code?: string; message?: string } | null = null;

    const aiResult = await generateAiInsights({
      last8Weeks: last8,
      last4Total,
      prev4Total,
      weeklyAvg,
      trendPct,
      topCourses,
      ruleBased: { forecastMonthly, trendPct, insights: ruleInsights },
    });

    if (aiResult.ok) {
      aiSource = 'openai';
      aiForecast = Number(aiResult.forecastMonthly || aiForecast);
      const trendInsight = aiResult.insights.find((item) => item.type === 'trend');
      if (trendInsight?.description) aiTrendText = trendInsight.description;
    } else {
      aiDebug = aiResult.debug;
    }

    return NextResponse.json({
      income: Number(incomeRows[0]?.total || 0),
      teacherProfit: Number(teacherRows[0]?.total || 0),
      platformProfit: Number(platformRows[0]?.total || 0),
      byType,
      count: Number(totalRows[0]?.total || 0),
      aiSource,
      aiForecast,
      aiTrendText,
      aiDebug,
    });
  } catch (error: any) {
    console.error('Finance reports error:', error);
    return NextResponse.json(
      { message: 'Failed to load reports', error: error.message },
      { status: 500 }
    );
  }
}
