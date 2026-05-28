import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { generateAiInsights } from '@/lib/ai-insights-provider';

type TxRow = {
  transactionDate: string;
  amount: number;
  studentId?: string | null;
  courseId?: string | null;
  courseTitle?: string | null;
};

type CourseAgg = { title: string; revenue: number; count: number };
type MonthForecast = { month: string; revenue: number; changePct: number };
type CourseForecast = { title: string; projectedRevenue: number; sharePct: number };
type StudentRiskRow = {
  studentId: string;
  fullName: string;
  email: string;
  enrolledCourses: number;
  avgProgress: number;
  avgQuizScore: number;
  maxMissedSessions: number;
  courses: string;
};
type CourseHealthRow = {
  courseId: string;
  title: string;
  teacherName: string | null;
  enrollments: number;
  completedEnrollments: number;
  avgProgress: number;
  avgQuizScore: number;
  attendanceRate: number;
};
type StudentRiskAlert = StudentRiskRow & {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskReason: string;
};
type CourseHealth = CourseHealthRow & {
  completionRate: number;
  healthScore: number;
  healthLabel: 'excellent' | 'good' | 'fair' | 'needs_attention';
};
type MonthlySummary = {
  revenue: number;
  enrollments: number;
  students: number;
  courses: number;
  atRiskStudents: number;
  averageCourseHealth: number;
};

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

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
        ft.studentId,
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
      studentId: row.studentId ? String(row.studentId) : null,
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

    const [studentRiskRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        u.id AS studentId,
        u.fullName,
        u.email,
        COUNT(DISTINCT e.courseId) AS enrolledCourses,
        COALESCE(AVG(e.progressPercentage), 0) AS avgProgress,
        COALESCE(
          (
            SELECT AVG(a.scorePercentage)
            FROM course_quiz_attempt a
            WHERE a.studentId = u.id
          ),
          0
        ) AS finalQuizAvg,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM course_quiz_attempt a
            WHERE a.studentId = u.id
          ),
          0
        ) AS finalQuizCount,
        COALESCE(
          (
            SELECT AVG(a.scorePercentage)
            FROM lesson_quiz_attempt a
            WHERE a.studentId = u.id
          ),
          0
        ) AS chapterQuizAvg,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM lesson_quiz_attempt a
            WHERE a.studentId = u.id
          ),
          0
        ) AS chapterQuizCount,
        COALESCE(
          (
            (
              COALESCE(
                (
                  SELECT AVG(a.scorePercentage)
                  FROM course_quiz_attempt a
                  WHERE a.studentId = u.id
                ),
                0
              ) * COALESCE(
                (
                  SELECT COUNT(*)
                  FROM course_quiz_attempt a
                  WHERE a.studentId = u.id
                ),
                0
              )
              +
              COALESCE(
                (
                  SELECT AVG(a.scorePercentage)
                  FROM lesson_quiz_attempt a
                  WHERE a.studentId = u.id
                ),
                0
              ) * COALESCE(
                (
                  SELECT COUNT(*)
                  FROM lesson_quiz_attempt a
                  WHERE a.studentId = u.id
                ),
                0
              )
            )
            /
            NULLIF(
              COALESCE(
                (
                  SELECT COUNT(*)
                  FROM course_quiz_attempt a
                  WHERE a.studentId = u.id
                ),
                0
              ) +
              COALESCE(
                (
                  SELECT COUNT(*)
                  FROM lesson_quiz_attempt a
                  WHERE a.studentId = u.id
                ),
                0
              ),
              0
            )
          ),
          0
        ) AS avgQuizScore,
        COALESCE(
          (
            SELECT MAX(m.missedCount)
            FROM student_live_miss m
            WHERE m.studentId = u.id
          ),
          0
        ) AS maxMissedSessions,
        COALESCE(GROUP_CONCAT(DISTINCT c.title ORDER BY e.enrolledAt DESC SEPARATOR ' â€¢ '), '') AS courses
      FROM user u
      JOIN role r ON r.id = u.roleId AND r.name = 'student'
      JOIN enrollment e ON e.studentId = u.id
      JOIN course c ON c.id = e.courseId
      GROUP BY u.id, u.fullName, u.email
      HAVING avgProgress < 65 OR avgQuizScore < 70 OR maxMissedSessions >= 3
      ORDER BY
        ((65 - avgProgress) + (70 - avgQuizScore) + (maxMissedSessions * 10)) DESC,
        avgProgress ASC
      LIMIT 6
      `
    );

    const studentRiskAlerts: StudentRiskAlert[] = (studentRiskRows as StudentRiskRow[]).map((row) => {
      const avgProgress = Number(row.avgProgress || 0);
      const finalQuizAvg = Number((row as RowDataPacket & { finalQuizAvg?: number }).finalQuizAvg || 0);
      const chapterQuizAvg = Number((row as RowDataPacket & { chapterQuizAvg?: number }).chapterQuizAvg || 0);
      const finalQuizCount = Number((row as RowDataPacket & { finalQuizCount?: number }).finalQuizCount || 0);
      const chapterQuizCount = Number((row as RowDataPacket & { chapterQuizCount?: number }).chapterQuizCount || 0);
      const quizAttempts = finalQuizCount + chapterQuizCount;
      const avgQuizScore =
        quizAttempts > 0
          ? (finalQuizAvg * finalQuizCount + chapterQuizAvg * chapterQuizCount) / quizAttempts
          : 0;
      const maxMissedSessions = Number(row.maxMissedSessions || 0);
      const progressPenalty = clamp((70 - avgProgress) * 0.7, 0, 35);
      const quizPenalty = clamp((75 - avgQuizScore) * 0.55, 0, 30);
      const attendancePenalty = clamp(maxMissedSessions * 10, 0, 35);
      const riskScore = Math.round(clamp(progressPenalty + quizPenalty + attendancePenalty, 0, 100));
      const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
      const weakestSignal =
        avgProgress < 65
          ? `Progress is ${Math.round(avgProgress)}%`
          : avgQuizScore < 70
            ? `Quiz average is ${Math.round(avgQuizScore)}%`
            : `Missed sessions: ${maxMissedSessions}`;

      return {
        ...row,
        avgProgress,
        avgQuizScore,
        maxMissedSessions,
        enrolledCourses: Number(row.enrolledCourses || 0),
        courses: String(row.courses || ''),
        riskScore,
        riskLevel,
        riskReason: weakestSignal,
      };
    });

    const [courseHealthRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        c.id AS courseId,
        c.title,
        t.fullName AS teacherName,
        COALESCE(
          (SELECT COUNT(*) FROM enrollment e WHERE e.courseId = c.id),
          0
        ) AS enrollments,
        COALESCE(
          (SELECT SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) FROM enrollment e WHERE e.courseId = c.id),
          0
        ) AS completedEnrollments,
        COALESCE(
          (SELECT AVG(e.progressPercentage) FROM enrollment e WHERE e.courseId = c.id),
          0
        ) AS avgProgress,
        COALESCE(
          (SELECT AVG(a.scorePercentage) FROM course_quiz_attempt a WHERE a.courseId = c.id),
          0
        ) AS avgQuizScore,
        COALESCE(
          (
            SELECT SUM(CASE WHEN lsa.attended = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100
            FROM live_session s
            LEFT JOIN live_session_attendance lsa ON lsa.sessionId = s.id
            WHERE s.courseId = c.id
          ),
          0
        ) AS attendanceRate
      FROM course c
      LEFT JOIN user t ON t.id = c.teacherId
      GROUP BY c.id, c.title, t.fullName
      ORDER BY enrollments DESC, avgProgress DESC
      LIMIT 6
      `
    );

    const courseHealth: CourseHealth[] = (courseHealthRows as CourseHealthRow[]).map((row) => {
      const completionRate = Number(row.enrollments || 0) > 0
        ? (Number(row.completedEnrollments || 0) / Number(row.enrollments || 0)) * 100
        : 0;
      const healthScore = Math.round(
        clamp(
          Number(row.avgProgress || 0) * 0.4 +
            Number(row.avgQuizScore || 0) * 0.35 +
            Number(row.attendanceRate || 0) * 0.25,
          0,
          100
        )
      );
      const healthLabel =
        healthScore >= 80 ? 'excellent' : healthScore >= 65 ? 'good' : healthScore >= 45 ? 'fair' : 'needs_attention';
      return {
        ...row,
        enrollments: Number(row.enrollments || 0),
        completedEnrollments: Number(row.completedEnrollments || 0),
        avgProgress: Number(row.avgProgress || 0),
        avgQuizScore: Number(row.avgQuizScore || 0),
        attendanceRate: Number(row.attendanceRate || 0),
        completionRate,
        healthScore,
        healthLabel,
      };
    });

    const monthlySummary: MonthlySummary = {
      revenue: tx.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      enrollments: tx.length,
      students: new Set(tx.map((item) => item.studentId).filter(Boolean)).size,
      courses: new Set(tx.map((item) => item.courseId).filter(Boolean)).size,
      atRiskStudents: studentRiskAlerts.length,
      averageCourseHealth:
        courseHealth.length > 0
          ? Math.round(courseHealth.reduce((sum, item) => sum + item.healthScore, 0) / courseHealth.length)
          : 0,
    };

    const topCourse = topCourses[0];
    const topCourseShare =
      topCourse && last4Total > 0 ? Math.round((topCourse.revenue / last4Total) * 100) : 0;

    const baseForecast = Number.isFinite(forecastMonthly) ? Math.max(0, forecastMonthly) : 0;
    const safeTrendPct = Number.isFinite(trendPct) ? Math.max(-0.3, Math.min(0.3, trendPct)) : 0;
    const nextMonths: MonthForecast[] = [];
    const firstMonthDate = new Date();
    firstMonthDate.setDate(1);
    firstMonthDate.setHours(0, 0, 0, 0);
    firstMonthDate.setMonth(firstMonthDate.getMonth() + 1);

    let projected = baseForecast;
    for (let i = 0; i < 4; i += 1) {
      const d = new Date(firstMonthDate);
      d.setMonth(firstMonthDate.getMonth() + i);
      if (i > 0) {
        projected *= 1 + safeTrendPct * 0.5;
      }
      nextMonths.push({
        month: monthKey(d),
        revenue: Math.max(0, Math.round(projected)),
        changePct: Number((safeTrendPct * 100).toFixed(1)),
      });
    }

    const courseForecasts: CourseForecast[] =
      topCourses.length > 0 && baseForecast > 0
        ? topCourses.map((c) => {
            const share = last4Total > 0 ? c.revenue / last4Total : 0;
            return {
              title: c.title,
              projectedRevenue: Math.round(baseForecast * Math.max(0, share)),
              sharePct: Math.round(share * 100),
            };
          })
        : [];

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
      nextMonths,
      courseForecasts,
      insights: finalInsights,
      monthlySummary,
      studentRiskAlerts,
      courseHealth,
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


