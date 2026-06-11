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
type TopCourseRow = RowDataPacket & { title: string; revenue: number; enrollments: number };
type TopTeacherRow = RowDataPacket & { teacherName: string; revenue: number; enrollments: number };
type TopCategoryRow = RowDataPacket & { categoryName: string; revenue: number; enrollments: number };
type CourseAgg = { title: string; revenue: number; count: number };

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPreviousMonth(month: string): string {
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number(yearRaw);
  const m = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(m) || m < 1 || m > 12) {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }
  const date = new Date(year, m - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const previousMonth = getPreviousMonth(month);

    const monthFilter = "AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?";

    const [incomeRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.amount), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.amount > 0
          ${monthFilter}
      `,
      [month]
    );

    const [teacherRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.teacherShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
      `,
      [month]
    );

    const [platformRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.platformShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
      `,
      [month]
    );

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT ft.type, COUNT(*) AS count
        FROM finance_transaction ft
        WHERE 1=1
          ${monthFilter}
        GROUP BY ft.type
      `,
      [month]
    );

    const [totalRows] = await pool.query<SumRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM finance_transaction ft
        WHERE 1=1
          ${monthFilter}
      `,
      [month]
    );

    const [prevIncomeRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.amount), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.amount > 0
          AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
      `,
      [previousMonth]
    );

    const [prevTeacherRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.teacherShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
      `,
      [previousMonth]
    );

    const [prevPlatformRows] = await pool.query<SumRow[]>(
      `
        SELECT COALESCE(SUM(ft.platformShare), 0) AS total
        FROM finance_transaction ft
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
      `,
      [previousMonth]
    );

    const [prevTotalRows] = await pool.query<SumRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM finance_transaction ft
        WHERE DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
      `,
      [previousMonth]
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
      [month]
    );

    const [topCoursesRows] = await pool.query<TopCourseRow[]>(
      `
        SELECT c.title, COALESCE(SUM(ft.amount), 0) AS revenue, COUNT(*) AS enrollments
        FROM finance_transaction ft
        JOIN course c ON c.id = ft.courseId
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
        GROUP BY c.id, c.title
        ORDER BY revenue DESC
        LIMIT 5
      `,
      [month]
    );

    const [topTeachersRows] = await pool.query<TopTeacherRow[]>(
      `
        SELECT
          COALESCE(NULLIF(TRIM(u.fullName), ''), u.email, 'Teacher') AS teacherName,
          COALESCE(SUM(ft.teacherShare), 0) AS revenue,
          COUNT(*) AS enrollments
        FROM finance_transaction ft
        LEFT JOIN user u ON u.id = ft.teacherId
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
        GROUP BY ft.teacherId, u.fullName, u.email
        ORDER BY revenue DESC
        LIMIT 5
      `,
      [month]
    );

    const [topCategoriesRows] = await pool.query<TopCategoryRow[]>(
      `
        SELECT
          COALESCE(cat.name, 'Uncategorized') AS categoryName,
          COALESCE(SUM(ft.amount), 0) AS revenue,
          COUNT(*) AS enrollments
        FROM finance_transaction ft
        LEFT JOIN course c ON c.id = ft.courseId
        LEFT JOIN category cat ON cat.id = c.categoryId
        WHERE ft.status = 'success'
          AND ft.type = 'enrollment'
          ${monthFilter}
        GROUP BY categoryName
        ORDER BY revenue DESC
        LIMIT 5
      `,
      [month]
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

    const topCoursesFromTx = Array.from(courseMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    const topCourse = topCoursesFromTx[0];
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
      topCourses: topCoursesFromTx,
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

    const income = Number(incomeRows[0]?.total || 0);
    const teacherProfit = Number(teacherRows[0]?.total || 0);
    const platformProfit = Number(platformRows[0]?.total || 0);
    const count = Number(totalRows[0]?.total || 0);

    const prevIncome = Number(prevIncomeRows[0]?.total || 0);
    const prevTeacherProfit = Number(prevTeacherRows[0]?.total || 0);
    const prevPlatformProfit = Number(prevPlatformRows[0]?.total || 0);
    const prevCount = Number(prevTotalRows[0]?.total || 0);

    const alerts: string[] = [];
    const incomeChangePct = pctChange(income, prevIncome);
    if (incomeChangePct < -10) alerts.push('Revenue dropped by more than 10% vs last month.');
    if (count < prevCount) alerts.push('Total transactions are lower than last month.');
    if (platformProfit < teacherProfit * 0.2) alerts.push('Platform margin is lower than expected this month.');

    return NextResponse.json({
      month,
      previousMonth,
      income,
      teacherProfit,
      platformProfit,
      byType,
      count,
      previous: {
        income: prevIncome,
        teacherProfit: prevTeacherProfit,
        platformProfit: prevPlatformProfit,
        count: prevCount,
      },
      deltas: {
        incomePct: pctChange(income, prevIncome),
        teacherProfitPct: pctChange(teacherProfit, prevTeacherProfit),
        platformProfitPct: pctChange(platformProfit, prevPlatformProfit),
        countPct: pctChange(count, prevCount),
      },
      topCourses: topCoursesRows.map((r) => ({
        title: String(r.title || 'Untitled'),
        revenue: Number(r.revenue || 0),
        enrollments: Number(r.enrollments || 0),
      })),
      topTeachers: topTeachersRows.map((r) => ({
        teacherName: String(r.teacherName || 'Teacher'),
        revenue: Number(r.revenue || 0),
        enrollments: Number(r.enrollments || 0),
      })),
      topCategories: topCategoriesRows.map((r) => ({
        categoryName: String(r.categoryName || 'Uncategorized'),
        revenue: Number(r.revenue || 0),
        enrollments: Number(r.enrollments || 0),
      })),
      alerts,
      aiSource,
      aiForecast,
      aiTrendText,
      aiDebug,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Finance reports error:', error);
    return NextResponse.json(
      { message: 'Failed to load reports', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
