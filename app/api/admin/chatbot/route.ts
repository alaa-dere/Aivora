import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/request-auth';

type RevenueRow = RowDataPacket & { total: number };
type TopCourseRow = RowDataPacket & { title: string; revenue: number };
type TopTeacherRow = RowDataPacket & { fullName: string; revenue: number };
type ActiveStudentRow = RowDataPacket & {
  studentId: string;
  fullName: string;
  completedLessons: number;
  quizAttempts: number;
  attendedSessions: number;
  activityScore: number;
};

type ActiveStudent = {
  studentId: string;
  fullName: string;
  completedLessons: number;
  quizAttempts: number;
  attendedSessions: number;
  activityScore: number;
};

type ChatbotIntent = 'monthly_revenue' | 'revenue_by_course' | 'most_active_students' | 'top_teacher' | 'help' | 'unknown';

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
    text.includes('الإيراد') ||
    text.includes('الاراد') ||
    text.includes('الإيرادات') ||
    text.includes('الارادات')
  ) {
    if (
      text.includes('by course') ||
      text.includes('course revenue') ||
      text.includes('top course') ||
      text.includes('highest course') ||
      text.includes('per course') ||
      text.includes('حسب الكورس') ||
      text.includes('بحسب الكورس')
    ) {
      return 'revenue_by_course';
    }
    return 'monthly_revenue';
  }

  if (
    text.includes('most active') ||
    text.includes('active students') ||
    text.includes('top students') ||
    text.includes('الأكثر الطلاب') ||
    text.includes('اكثر الطلاب') ||
    text.includes('نشاط')
  ) {
    return 'most_active_students';
  }

  if (
    (text.includes('teacher') || text.includes('teachers') || text.includes('المعلم') || text.includes('المعلمين')) &&
    (text.includes('top') || text.includes('best') || text.includes('most') || text.includes('افضل') || text.includes('أفضل'))
  ) {
    return 'top_teacher';
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

function formatPlainNumber(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getCurrentMonthLabel(targetMonth: string) {
  const [year, month] = targetMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

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

  if (text.includes('last month')) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  if (text.includes('this month')) {
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
  return {
    title: String(top.title || 'Unknown'),
    revenue: Number(top.revenue || 0),
  };
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
  return {
    name: String(top.fullName || 'Unknown'),
    revenue: Number(top.revenue || 0),
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
      studentId: String(row.studentId || ''),
      fullName: String(row.fullName || 'Unknown'),
      completedLessons: Number(row.completedLessons || 0),
      quizAttempts: Number(row.quizAttempts || 0),
      attendedSessions: Number(row.attendedSessions || 0),
      activityScore: Number(row.activityScore || 0),
    }))
    .filter((student) => student.activityScore > 0);
}

function buildAnswer(
  intent: ChatbotIntent,
  language: 'ar' | 'en',
  data: {
    monthLabel: string;
    monthlyRevenue: number;
    topCourse: { title: string; revenue: number } | null;
    topTeacher: { name: string; revenue: number } | null;
    activeStudents: ActiveStudent[];
  }
) {
  if (intent === 'monthly_revenue') {
    return language === 'ar'
      ? `إيراد ${data.monthLabel} هو ${formatPlainNumber(data.monthlyRevenue)}.`
      : `Revenue for ${data.monthLabel} is ${formatPlainNumber(data.monthlyRevenue)}.`;
  }

  if (intent === 'revenue_by_course') {
    if (!data.topCourse) {
      return language === 'ar'
        ? 'لا يوجد تفصيل متاح للإيراد بحسب الكورس في البيانات الحالية.'
        : 'A course revenue breakdown is not available in the current data.';
    }
    return language === 'ar'
      ? `أعلى إيراد لكورس في ${data.monthLabel} هو "${data.topCourse.title}" بإيراد ${formatPlainNumber(data.topCourse.revenue)}.`
      : `The top revenue course for ${data.monthLabel} is "${data.topCourse.title}" with revenue ${formatPlainNumber(
          data.topCourse.revenue
        )}.`;
  }

  if (intent === 'top_teacher') {
    if (!data.topTeacher) {
      return language === 'ar'
        ? 'لا يوجد معلم أعلى إيرادًا في البيانات الحالية.'
        : 'A top teacher is not available in the current data.';
    }
    return language === 'ar'
      ? `أفضل معلم في ${data.monthLabel} هو "${data.topTeacher.name}" بإيراد ${formatPlainNumber(data.topTeacher.revenue)}.`
      : `The top teacher for ${data.monthLabel} is "${data.topTeacher.name}" with revenue ${formatPlainNumber(
          data.topTeacher.revenue
        )}.`;
  }

  if (intent === 'most_active_students') {
    if (!data.activeStudents.length) {
      return language === 'ar'
        ? 'لا يوجد نشاط كافٍ للطلاب خلال آخر 30 يوم لعرض ترتيب واضح.'
        : 'There is not enough student activity in the last 30 days to rank reliably.';
    }

    const topStudents = data.activeStudents
      .slice(0, 3)
      .map((student, index) => `${index + 1}) ${student.fullName} (${student.activityScore})`)
      .join(language === 'ar' ? '، ' : ', ');

    return language === 'ar'
      ? `أكثر الطلاب نشاطًا خلال آخر 30 يوم: ${topStudents}.`
      : `Most active students in the last 30 days: ${topStudents}.`;
  }

  return language === 'ar'
    ? 'أقدر أجيب عن إيراد الشهر، أعلى كورس من حيث الإيراد، أفضل معلم، وأكثر الطلاب نشاطًا. اسألني بصيغة طبيعية.'
    : 'I can answer about monthly revenue, top revenue course, top teacher, and most active students. Ask in natural language.';
}

function suggestedQuestions(language: 'ar' | 'en') {
  return language === 'ar'
    ? ['ما هو إيراد هذا الشهر؟', 'ما هو أعلى كورس من حيث الإيراد؟', 'من هو أكثر الطلاب نشاطًا؟']
    : ['What is this month’s revenue?', 'Which course generated the highest revenue?', 'Who are the most active students?'];
}

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || '').trim();
    const language = detectLanguage(message);
    const intent = detectIntent(message);
    const targetMonth = extractTargetMonth(message);
    const monthLabel = getCurrentMonthLabel(targetMonth);

    const [monthlyRevenue, topCourse, topTeacher, activeStudents] = await Promise.all([
      getMonthlyRevenue(targetMonth),
      getTopCourseForMonth(targetMonth),
      getTopTeacherForMonth(targetMonth),
      getMostActiveStudents(),
    ]);

    const answer = buildAnswer(intent, language, {
      monthLabel,
      monthlyRevenue,
      topCourse,
      topTeacher,
      activeStudents,
    });

    return NextResponse.json({
      intent,
      source: 'rule-based',
      answer,
      suggestedQuestions: suggestedQuestions(language),
      data: {
        targetMonth,
        monthLabel,
        monthlyRevenue,
        topCourse,
        topTeacher,
        mostActiveStudents: activeStudents,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to process chatbot request', error: message }, { status: 500 });
  }
}
