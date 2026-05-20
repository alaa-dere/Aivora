import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin } from '@/lib/request-auth';
import { generateAdminChatbotReply } from '@/lib/admin-chatbot-provider';
import { ensureCourseEvaluationSchema } from '@/lib/ensure-course-evaluation-schema';

type RevenueRow = RowDataPacket & { total: number };
type CountRow = RowDataPacket & { total: number };
type TopTeacherRow = RowDataPacket & { fullName: string; revenue: number };
type TopCourseRow = RowDataPacket & { title: string; revenue: number };
type ActiveStudentRow = RowDataPacket & {
  studentId: string;
  fullName: string;
  completedLessons: number;
  quizAttempts: number;
  attendedSessions: number;
  activityScore: number;
};
type GenericRow = RowDataPacket & Record<string, unknown>;

type ActiveStudent = {
  studentId: string;
  fullName: string;
  completedLessons: number;
  quizAttempts: number;
  attendedSessions: number;
  activityScore: number;
};

type ChatbotIntent = 'monthly_revenue' | 'most_active_students' | 'help' | 'unknown';

function normalizeText(input: string) {
  return String(input || '').trim().toLowerCase();
}

function detectLanguage(input: string): 'ar' | 'en' {
  return /[\u0600-\u06FF]/.test(String(input || '')) ? 'ar' : 'en';
}

function detectIntent(message: string): ChatbotIntent {
  const text = normalizeText(message);
  if (!text) return 'help';

  if (
    text.includes('revenue') ||
    text.includes('income') ||
    text.includes('الايراد') ||
    text.includes('الإيراد') ||
    text.includes('الايرادات') ||
    text.includes('الإيرادات')
  ) {
    return 'monthly_revenue';
  }

  if (
    text.includes('most active') ||
    text.includes('active students') ||
    text.includes('top students') ||
    text.includes('اكثر الطلاب') ||
    text.includes('أكثر الطلاب') ||
    text.includes('نشاط')
  ) {
    return 'most_active_students';
  }

  if (
    text.includes('help') ||
    text.includes('what can you do') ||
    text.includes('ساعد') ||
    text.includes('شو بتقدر') ||
    text.includes('شو تعمل')
  ) {
    return 'help';
  }

  return 'unknown';
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const EN_MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const AR_MONTHS: Record<string, number> = {
  'يناير': 1,
  'كانون الثاني': 1,
  'فبراير': 2,
  'شباط': 2,
  'مارس': 3,
  'آذار': 3,
  'ابريل': 4,
  'أبريل': 4,
  'نيسان': 4,
  'مايو': 5,
  'أيار': 5,
  'يونيو': 6,
  'حزيران': 6,
  'يوليو': 7,
  'تموز': 7,
  'اغسطس': 8,
  'أغسطس': 8,
  'آب': 8,
  'سبتمبر': 9,
  'أيلول': 9,
  'اكتوبر': 10,
  'أكتوبر': 10,
  'تشرين الأول': 10,
  'نوفمبر': 11,
  'تشرين الثاني': 11,
  'ديسمبر': 12,
  'كانون الأول': 12,
};

function extractTargetMonth(input: string): string {
  const text = String(input || '').toLowerCase();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const isoMonthMatch = text.match(/\b(20\d{2})[-\/](0?[1-9]|1[0-2])\b/);
  if (isoMonthMatch) {
    const year = Number(isoMonthMatch[1]);
    const month = Number(isoMonthMatch[2]);
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  const yearMatch = text.match(/\b(20\d{2})\b/);
  const explicitYear = yearMatch ? Number(yearMatch[1]) : now.getFullYear();

  for (const [name, month] of Object.entries(EN_MONTHS)) {
    if (text.includes(name)) {
      return `${explicitYear}-${String(month).padStart(2, '0')}`;
    }
  }

  for (const [name, month] of Object.entries(AR_MONTHS)) {
    if (text.includes(name.toLowerCase())) {
      return `${explicitYear}-${String(month).padStart(2, '0')}`;
    }
  }

  if (text.includes('last month') || text.includes('الشهر الماضي')) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  if (text.includes('this month') || text.includes('هذا الشهر')) {
    return currentMonth;
  }

  return currentMonth;
}

async function getMonthlyRevenue(targetMonth: string) {
  const [rows] = await db.query<RevenueRow[]>(
    `
      SELECT COALESCE(SUM(ft.amount), 0) AS total
      FROM finance_transaction ft
      WHERE ft.status = 'success'
        AND ft.amount > 0
        AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
    `,
    [targetMonth]
  );
  return Number(rows[0]?.total || 0);
}

async function getMonthlyRevenueHistory() {
  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT DATE_FORMAT(ft.transactionDate, '%Y-%m') AS ym, COALESCE(SUM(ft.amount), 0) AS revenue
      FROM finance_transaction ft
      WHERE ft.status = 'success'
        AND ft.amount > 0
        AND ft.transactionDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(ft.transactionDate, '%Y-%m')
      ORDER BY ym DESC
      LIMIT 12
    `
  );

  return rows.map((row) => ({
    month: String(row.ym || ''),
    revenue: Number(row.revenue || 0),
  }));
}

async function getMonthlyEnrollments(targetMonth: string) {
  const [rows] = await db.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM enrollment e
      WHERE DATE_FORMAT(e.enrolledAt, '%Y-%m') = ?
    `,
    [targetMonth]
  );
  return Number(rows[0]?.total || 0);
}

async function getPreviousMonthEnrollments(targetMonth: string) {
  const [year, month] = targetMonth.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return getMonthlyEnrollments(prevMonth);
}

async function getTopAndLowestEnrollmentCourses(targetMonth: string) {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        c.id,
        c.title,
        COUNT(e.id) AS enrollments
      FROM course c
      LEFT JOIN enrollment e
        ON e.courseId = c.id
        AND DATE_FORMAT(e.enrolledAt, '%Y-%m') = ?
      GROUP BY c.id, c.title
      ORDER BY enrollments DESC, c.title ASC
    `,
    [targetMonth]
  );

  if (!rows.length) {
    return { topCourse: null, lowestCourse: null };
  }

  const normalized = rows.map((row) => ({
    id: String(row.id || ''),
    title: String(row.title || 'Unknown'),
    enrollments: Number(row.enrollments || 0),
  }));

  return {
    topCourse: normalized[0] || null,
    lowestCourse: normalized[normalized.length - 1] || null,
  };
}

async function getSuccessRate() {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        COUNT(*) AS totalAttempts,
        SUM(CASE WHEN a.scorePercentage >= 60 THEN 1 ELSE 0 END) AS passedAttempts,
        AVG(a.scorePercentage) AS avgScore
      FROM course_quiz_attempt a
      WHERE a.submittedAt >= DATE_SUB(NOW(), INTERVAL 120 DAY)
    `
  );
  const row = rows[0] || {};
  const total = Number(row.totalAttempts || 0);
  const passed = Number(row.passedAttempts || 0);
  return {
    totalAttempts: total,
    passedAttempts: passed,
    successRatePct: total > 0 ? (passed / total) * 100 : 0,
    avgScorePct: Number(row.avgScore || 0),
  };
}

async function getCourseCompletionRate() {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        COUNT(*) AS totalEnrollments,
        SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedEnrollments
      FROM enrollment e
    `
  );
  const row = rows[0] || {};
  const total = Number(row.totalEnrollments || 0);
  const completed = Number(row.completedEnrollments || 0);
  return {
    totalEnrollments: total,
    completedEnrollments: completed,
    completionRatePct: total > 0 ? (completed / total) * 100 : 0,
  };
}

async function getAttendanceRate() {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        COUNT(*) AS totalMarks,
        SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) AS attendedMarks
      FROM live_session_attendance
    `
  );
  const row = rows[0] || {};
  const total = Number(row.totalMarks || 0);
  const attended = Number(row.attendedMarks || 0);
  return {
    totalMarks: total,
    attendedMarks: attended,
    attendanceRatePct: total > 0 ? (attended / total) * 100 : 0,
  };
}

async function getTopTeacherByPerformance() {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        t.id AS teacherId,
        t.fullName,
        AVG(COALESCE(e.progressPercentage, 0)) AS avgProgress,
        SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedEnrollments,
        COUNT(e.id) AS totalEnrollments
      FROM user t
      JOIN role r ON r.id = t.roleId AND r.name = 'teacher'
      LEFT JOIN course c ON c.teacherId = t.id
      LEFT JOIN enrollment e ON e.courseId = c.id
      GROUP BY t.id, t.fullName
      ORDER BY avgProgress DESC, completedEnrollments DESC, totalEnrollments DESC
      LIMIT 1
    `
  );
  const row = rows[0];
  if (!row) return null;
  return {
    teacherId: String(row.teacherId || ''),
    fullName: String(row.fullName || 'Unknown'),
    avgProgress: Number(row.avgProgress || 0),
    completedEnrollments: Number(row.completedEnrollments || 0),
    totalEnrollments: Number(row.totalEnrollments || 0),
  };
}

async function getHardestCourseByQuizScore() {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        c.id AS courseId,
        c.title,
        AVG(a.scorePercentage) AS avgScore,
        COUNT(a.id) AS attempts
      FROM course c
      JOIN course_quiz_attempt a ON a.courseId = c.id
      GROUP BY c.id, c.title
      HAVING attempts >= 3
      ORDER BY avgScore ASC, attempts DESC
      LIMIT 1
    `
  );
  const row = rows[0];
  if (!row) return null;
  return {
    courseId: String(row.courseId || ''),
    title: String(row.title || 'Unknown'),
    avgScore: Number(row.avgScore || 0),
    attempts: Number(row.attempts || 0),
  };
}

async function getStudentSatisfaction() {
  const [rows] = await db.query<GenericRow[]>(
    `
      SELECT
        COUNT(*) AS totalFeedback,
        AVG(ce.rating) AS avgRating,
        SUM(CASE WHEN ce.rating >= 4 THEN 1 ELSE 0 END) AS positiveCount,
        SUM(CASE WHEN ce.rating <= 2 THEN 1 ELSE 0 END) AS negativeCount
      FROM course_evaluation ce
      WHERE ce.rating IS NOT NULL
    `
  );
  const row = rows[0] || {};
  const total = Number(row.totalFeedback || 0);
  return {
    totalFeedback: total,
    avgRating: Number(row.avgRating || 0),
    positivePct: total > 0 ? (Number(row.positiveCount || 0) / total) * 100 : 0,
    negativePct: total > 0 ? (Number(row.negativeCount || 0) / total) * 100 : 0,
  };
}

function buildForecastFromHistory(history: Array<{ month: string; revenue: number }>) {
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
  const last4 = sorted.slice(-4);
  const prev4 = sorted.slice(Math.max(0, sorted.length - 8), Math.max(0, sorted.length - 4));
  const sum = (arr: Array<{ revenue: number }>) => arr.reduce((acc, cur) => acc + Number(cur.revenue || 0), 0);
  const last4Total = sum(last4);
  const prev4Total = sum(prev4);
  const weeklyLikeTrend = prev4Total > 0 ? (last4Total - prev4Total) / prev4Total : 0;
  const avgMonthly = last4.length ? last4Total / last4.length : 0;
  const nextMonthForecast = avgMonthly * (1 + Math.max(-0.25, Math.min(0.25, weeklyLikeTrend * 0.5)));
  return {
    nextMonthForecast,
    trendPct: weeklyLikeTrend * 100,
    riskLevel:
      weeklyLikeTrend < -0.15 ? 'high' : weeklyLikeTrend < -0.05 ? 'medium' : 'low',
  };
}

async function getMostActiveStudents() {
  const [rows] = await db.query<ActiveStudentRow[]>(
    `
      SELECT
        u.id AS studentId,
        u.fullName,
        COALESCE(lp.completedLessons, 0) AS completedLessons,
        COALESCE(qa.quizAttempts, 0) AS quizAttempts,
        COALESCE(att.attendedSessions, 0) AS attendedSessions,
        (
          COALESCE(lp.completedLessons, 0) +
          (COALESCE(qa.quizAttempts, 0) * 2) +
          (COALESCE(att.attendedSessions, 0) * 2)
        ) AS activityScore
      FROM user u
      JOIN role r ON r.id = u.roleId AND r.name = 'student'
      LEFT JOIN (
        SELECT e.studentId, COUNT(*) AS completedLessons
        FROM lessonprogress lp
        JOIN enrollment e ON e.id = lp.enrollmentId
        WHERE lp.completed = 1
          AND lp.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY e.studentId
      ) lp ON lp.studentId = u.id
      LEFT JOIN (
        SELECT a.studentId, COUNT(*) AS quizAttempts
        FROM course_quiz_attempt a
        WHERE a.submittedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY a.studentId
      ) qa ON qa.studentId = u.id
      LEFT JOIN (
        SELECT lsa.studentId, COUNT(*) AS attendedSessions
        FROM live_session_attendance lsa
        WHERE lsa.attended = 1
          AND lsa.markedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY lsa.studentId
      ) att ON att.studentId = u.id
      ORDER BY activityScore DESC, u.fullName ASC
      LIMIT 5
    `
  );

  return rows
    .map((row) => ({
      studentId: String(row.studentId),
      fullName: String(row.fullName || 'Unknown'),
      completedLessons: Number(row.completedLessons || 0),
      quizAttempts: Number(row.quizAttempts || 0),
      attendedSessions: Number(row.attendedSessions || 0),
      activityScore: Number(row.activityScore || 0),
    }))
    .filter((student) => student.activityScore > 0);
}

async function getTopTeacherForMonth(targetMonth: string) {
  const [rows] = await db.query<TopTeacherRow[]>(
    `
      SELECT
        u.fullName,
        COALESCE(SUM(ft.teacherShare), 0) AS revenue
      FROM finance_transaction ft
      JOIN user u ON u.id = ft.teacherId
      WHERE ft.status = 'success'
        AND ft.type = 'enrollment'
        AND ft.teacherId IS NOT NULL
        AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
      GROUP BY u.id, u.fullName
      ORDER BY revenue DESC
      LIMIT 1
    `,
    [targetMonth]
  );
  const top = rows[0];
  if (!top) return null;
  return { name: String(top.fullName || 'Unknown'), revenue: Number(top.revenue || 0) };
}

async function getTopCourseForMonth(targetMonth: string) {
  const [rows] = await db.query<TopCourseRow[]>(
    `
      SELECT
        c.title,
        COALESCE(SUM(ft.amount), 0) AS revenue
      FROM finance_transaction ft
      JOIN course c ON c.id = ft.courseId
      WHERE ft.status = 'success'
        AND ft.type = 'enrollment'
        AND DATE_FORMAT(ft.transactionDate, '%Y-%m') = ?
      GROUP BY c.id, c.title
      ORDER BY revenue DESC
      LIMIT 1
    `,
    [targetMonth]
  );
  const top = rows[0];
  if (!top) return null;
  return { title: String(top.title || 'Unknown'), revenue: Number(top.revenue || 0) };
}

async function getBasicCounts() {
  const [studentRows] = await db.query<CountRow[]>(
    `SELECT COUNT(*) AS total FROM user u JOIN role r ON r.id = u.roleId WHERE r.name = 'student'`
  );
  const [teacherRows] = await db.query<CountRow[]>(
    `SELECT COUNT(*) AS total FROM user u JOIN role r ON r.id = u.roleId WHERE r.name = 'teacher'`
  );
  const [courseRows] = await db.query<CountRow[]>(`SELECT COUNT(*) AS total FROM course WHERE status = 'published'`);
  return {
    totalStudents: Number(studentRows[0]?.total || 0),
    totalTeachers: Number(teacherRows[0]?.total || 0),
    totalPublishedCourses: Number(courseRows[0]?.total || 0),
  };
}

function fallbackAnswer(intent: ChatbotIntent, language: 'ar' | 'en', data: { monthlyRevenue: number; activeStudents: ActiveStudent[] }) {
  if (intent === 'monthly_revenue') {
    return language === 'ar'
      ? `إيرادات هذا الشهر حتى الآن هي ${formatMoney(data.monthlyRevenue)}.`
      : `This month's revenue so far is ${formatMoney(data.monthlyRevenue)}.`;
  }

  if (intent === 'most_active_students') {
    if (!data.activeStudents.length) {
      return language === 'ar'
        ? 'لا يوجد نشاط كافٍ للطلاب خلال آخر 30 يوم لعرض ترتيب واضح.'
        : 'There is not enough student activity in the last 30 days to rank reliably.';
    }
    const top = data.activeStudents
      .slice(0, 3)
      .map((s, idx) => `${idx + 1}) ${s.fullName} (${s.activityScore})`)
      .join(language === 'ar' ? '، ' : ', ');
    return language === 'ar'
      ? `أكثر الطلاب نشاطًا خلال آخر 30 يوم: ${top}.`
      : `Most active students in the last 30 days: ${top}.`;
  }

  return language === 'ar'
    ? 'أقدر أجاوب عن الإيرادات، الطلاب الأكثر نشاطًا، أفضل معلم، وأفضل دورة. اسألني بصيغة طبيعية.'
    : 'I can answer about revenue, most active students, top teacher, and top course. Ask in natural language.';
}

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await ensureCourseEvaluationSchema();
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || '').trim();
    const language = detectLanguage(message);
    const intent = detectIntent(message);
    const targetMonth = extractTargetMonth(message);

    const [
      monthlyRevenue,
      monthlyRevenueHistory,
      activeStudents,
      topTeacher,
      topCourse,
      counts,
      monthlyEnrollments,
      previousMonthEnrollments,
      enrollmentCourses,
      successMetrics,
      completionMetrics,
      attendanceMetrics,
      topTeacherPerformance,
      hardestCourse,
      satisfaction,
    ] = await Promise.all([
      getMonthlyRevenue(targetMonth),
      getMonthlyRevenueHistory(),
      getMostActiveStudents(),
      getTopTeacherForMonth(targetMonth),
      getTopCourseForMonth(targetMonth),
      getBasicCounts(),
      getMonthlyEnrollments(targetMonth),
      getPreviousMonthEnrollments(targetMonth),
      getTopAndLowestEnrollmentCourses(targetMonth),
      getSuccessRate(),
      getCourseCompletionRate(),
      getAttendanceRate(),
      getTopTeacherByPerformance(),
      getHardestCourseByQuizScore(),
      getStudentSatisfaction(),
    ]);

    const [targetYear, targetMonthNum] = targetMonth.split('-');
    const monthLabel = new Date(Number(targetYear), Number(targetMonthNum) - 1, 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    const forecast = buildForecastFromHistory(monthlyRevenueHistory);
    const enrollmentChangePct =
      previousMonthEnrollments > 0
        ? ((monthlyEnrollments - previousMonthEnrollments) / previousMonthEnrollments) * 100
        : monthlyEnrollments > 0
          ? 100
          : 0;

    const avgRevenuePerStudent =
      counts.totalStudents > 0 ? monthlyRevenue / counts.totalStudents : 0;

    const analytics = {
      finance: {
        targetMonth,
        monthLabel,
        monthlyRevenue,
        monthlyRevenueHistory,
        enrollmentChangePct,
        monthlyEnrollments,
        previousMonthEnrollments,
        nextMonthRevenueForecast: forecast.nextMonthForecast,
        financialRiskLevel: forecast.riskLevel,
        trendPct: forecast.trendPct,
        avgRevenuePerStudent,
        topRevenueCourse: topCourse,
        topEnrollmentCourse: enrollmentCourses.topCourse,
        lowestEnrollmentCourse: enrollmentCourses.lowestCourse,
      },
      academic: {
        topTeacherPerformance,
        hardestCourse,
        successRatePct: successMetrics.successRatePct,
        avgQuizScorePct: successMetrics.avgScorePct,
        courseCompletionRatePct: completionMetrics.completionRatePct,
        attendanceRatePct: attendanceMetrics.attendanceRatePct,
        inactiveStudentsCount: Math.max(0, counts.totalStudents - activeStudents.length),
        mostActiveStudents: activeStudents,
      },
      sentiment: satisfaction,
      notes: {
        unsupportedDirectMetrics: [
          'Precise ROI by course requires explicit cost data.',
          'Late payment ratio requires due-date/overdue payment fields.',
          'Institution performance by exact day needs stronger event logging coverage.',
        ],
      },
    };

    const aiResult = await generateAdminChatbotReply({
      question: message,
      preferredLanguage: language,
      context: {
        targetMonth,
        monthLabel,
        monthlyRevenue,
        monthlyRevenueHistory,
        totalStudents: counts.totalStudents,
        totalTeachers: counts.totalTeachers,
        totalPublishedCourses: counts.totalPublishedCourses,
        topTeacher,
        topCourse,
        mostActiveStudents: activeStudents.map((s) => ({
          fullName: s.fullName,
          activityScore: s.activityScore,
          completedLessons: s.completedLessons,
          quizAttempts: s.quizAttempts,
          attendedSessions: s.attendedSessions,
        })),
        analytics,
      },
    });

    if (aiResult.ok) {
      return NextResponse.json({
        intent,
        source: 'openai',
        answer: aiResult.answer,
        suggestedQuestions: aiResult.suggestedQuestions,
        data: { targetMonth, monthLabel, monthlyRevenue, monthlyRevenueHistory, topTeacher, topCourse, mostActiveStudents: activeStudents, analytics },
      });
    }

    return NextResponse.json({
      intent,
      source: 'rule-based',
      answer: fallbackAnswer(intent, language, { monthlyRevenue, activeStudents }),
      suggestedQuestions:
        language === 'ar'
          ? ['مين أفضل معلم هذا الشهر؟', 'ما هي أعلى دورة من حيث الإيراد؟', 'اعطيني ملخص مالي سريع لهذا الشهر']
          : [
              'Who is the top teacher this month?',
              'Which course generated the highest revenue?',
              'Give me a quick monthly finance summary',
            ],
      debug: aiResult.debug,
      data: { targetMonth, monthLabel, monthlyRevenue, monthlyRevenueHistory, topTeacher, topCourse, mostActiveStudents: activeStudents, analytics },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to process chatbot request', error: message }, { status: 500 });
  }
}
