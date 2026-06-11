'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type Insight = {
  type: 'forecast' | 'trend' | 'recommendation';
  title: string;
  description: string;
};

type TopCourse = {
  title: string;
  revenue: number;
  count: number;
};

type NextMonthForecast = {
  month: string;
  revenue: number;
  changePct: number;
};

type CourseForecast = {
  title: string;
  projectedRevenue: number;
  sharePct: number;
};

type StudentRiskAlert = {
  studentId: string;
  fullName: string;
  email: string;
  enrolledCourses: number;
  avgProgress: number;
  avgQuizScore: number;
  maxMissedSessions: number;
  courses: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskReason: string;
};

type CourseHealth = {
  courseId: string;
  title: string;
  teacherName: string | null;
  enrollments: number;
  completedEnrollments: number;
  avgProgress: number;
  avgQuizScore: number;
  attendanceRate: number;
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

function money(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function AdminFinanceForecastPage() {
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [forecast, setForecast] = useState({
    forecastMonthly: 0,
    trendPct: 0,
    last4Total: 0,
    prev4Total: 0,
    source: 'unknown' as 'openai' | 'rule-based' | 'unknown',
    insights: [] as Insight[],
    topCourses: [] as TopCourse[],
    nextMonths: [] as NextMonthForecast[],
    courseForecasts: [] as CourseForecast[],
    studentRiskAlerts: [] as StudentRiskAlert[],
    courseHealth: [] as CourseHealth[],
    monthlySummary: null as MonthlySummary | null,
    aiDebug: null as { provider: 'openai' | 'none'; status?: number; code?: string; message?: string } | null,
  });
  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const query = `month=${encodeURIComponent(month)}`;

        const forecastRes = await fetch(`/api/admin/ai/revenue-forecast?${query}`, { cache: 'no-store' });

        const forecastData = await forecastRes.json();

        if (!forecastRes.ok) {
          throw new Error(forecastData?.message || 'Failed to load forecast');
        }

        setForecast({
          forecastMonthly: Number(forecastData.forecastMonthly || 0),
          trendPct: Number(forecastData.trendPct || 0),
          last4Total: Number(forecastData.last4Total || 0),
          prev4Total: Number(forecastData.prev4Total || 0),
          source:
            forecastData.source === 'openai' || forecastData.source === 'rule-based'
              ? forecastData.source
              : 'unknown',
          insights: Array.isArray(forecastData.insights) ? forecastData.insights : [],
          topCourses: Array.isArray(forecastData.topCourses) ? forecastData.topCourses : [],
          nextMonths: Array.isArray(forecastData.nextMonths) ? forecastData.nextMonths : [],
          courseForecasts: Array.isArray(forecastData.courseForecasts) ? forecastData.courseForecasts : [],
          studentRiskAlerts: Array.isArray(forecastData.studentRiskAlerts) ? forecastData.studentRiskAlerts : [],
          courseHealth: Array.isArray(forecastData.courseHealth) ? forecastData.courseHealth : [],
          monthlySummary: forecastData.monthlySummary || null,
          aiDebug: forecastData.aiDebug || null,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
      }
    };

    load();
  }, [month]);

  const trendPercentLabel = useMemo(() => `${Math.round((forecast.trendPct || 0) * 100)}%`, [forecast.trendPct]);
  const riskCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const item of forecast.studentRiskAlerts) {
      counts[item.riskLevel] += 1;
    }
    return counts;
  }, [forecast.studentRiskAlerts]);
  const studentAtRiskCount = forecast.studentRiskAlerts.length;
  const avgCourseHealth =
    forecast.monthlySummary?.averageCourseHealth ??
    (forecast.courseHealth.length > 0
      ? Math.round(forecast.courseHealth.reduce((sum, course) => sum + course.healthScore, 0) / forecast.courseHealth.length)
      : 0);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Finance Forecast</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep view of projected revenue, trend movement, and AI recommendations.
          </p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Source: {forecast.source === 'openai' ? 'OpenAI' : forecast.source === 'rule-based' ? 'Rule-based' : 'Unknown'}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-2">
            <CalendarDaysIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

      {forecast.source === 'rule-based' && forecast.aiDebug?.message ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/70 dark:bg-amber-900/20 dark:text-amber-300">
          Gemini fallback reason: {forecast.aiDebug.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Projected Next Month</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{money(forecast.forecastMonthly)}</p>
        </div>

        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">4-Week Trend</p>
          <div className="mt-1 flex items-center gap-2">
            {forecast.trendPct >= 0 ? (
              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowTrendingDownIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            )}
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{trendPercentLabel}</p>
          </div>
        </div>

        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-900/25 dark:text-sky-300">
            <ChartBarIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recent Window Revenue</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{money(forecast.last4Total)}</p>
        </div>

        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Student at Risk</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{studentAtRiskCount}</p>
        </div>

        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md sm:col-span-2 xl:col-span-1">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300">
            <AcademicCapIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg Courses Health</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{avgCourseHealth}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-500 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300">
                <ExclamationTriangleIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Student Risk Alert</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Students who need support now</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-1">High {riskCounts.high}</span>
              <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1">Med {riskCounts.medium}</span>
              <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1">Low {riskCounts.low}</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {forecast.studentRiskAlerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No high-risk students detected in the current data window.</p>
            ) : (
              forecast.studentRiskAlerts.map((student) => {
                const tone =
                  student.riskLevel === 'high'
                    ? 'border-sky-200 bg-sky-50/90 dark:border-sky-900/60 dark:bg-sky-900/20'
                    : student.riskLevel === 'medium'
                      ? 'border-blue-200 bg-blue-50/90 dark:border-blue-900/60 dark:bg-blue-900/20'
                      : 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/60 dark:bg-emerald-900/20';
                const badge =
                  student.riskLevel === 'high'
                    ? 'text-sky-700 dark:text-sky-300'
                    : student.riskLevel === 'medium'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-emerald-700 dark:text-emerald-300';
                return (
                  <div key={student.studentId} className={`rounded-xl border p-2.5 sm:p-3 ${tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{student.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white/70 dark:bg-slate-950/30 ${badge}`}>
                        {student.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="rounded-lg bg-white/70 dark:bg-slate-950/25 p-1.5">
                        <p className="text-slate-400 dark:text-slate-500">Progress</p>
                        <p className="font-semibold">{Math.round(student.avgProgress)}%</p>
                      </div>
                      <div className="rounded-lg bg-white/70 dark:bg-slate-950/25 p-1.5">
                        <p className="text-slate-400 dark:text-slate-500">Quiz avg</p>
                        <p className="font-semibold">{Math.round(student.avgQuizScore)}%</p>
                      </div>
                      <div className="rounded-lg bg-white/70 dark:bg-slate-950/25 p-1.5">
                        <p className="text-slate-400 dark:text-slate-500">Missed</p>
                        <p className="font-semibold">{student.maxMissedSessions}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {student.riskReason}
                    </p>
                    {student.courses ? (
                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {student.courses}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="admin-surface forecast-card cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-500 ease-out relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300">
              <AcademicCapIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Course Health</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">How strong each course looks from progress, quizzes, and live attendance</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {forecast.courseHealth.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No course health snapshot available yet.</p>
            ) : (
              forecast.courseHealth.map((course) => {
                const labelClass =
                  course.healthLabel === 'excellent'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : course.healthLabel === 'good'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : course.healthLabel === 'fair'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
                const barClass =
                  course.healthLabel === 'excellent'
                    ? 'from-blue-500 to-sky-400'
                    : course.healthLabel === 'good'
                      ? 'from-sky-500 to-blue-400'
                      : course.healthLabel === 'fair'
                        ? 'from-blue-500 to-cyan-400'
                        : 'from-sky-500 to-blue-500';
                return (
                  <div key={course.courseId} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/55 p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{course.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.teacherName || 'Teacher'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${labelClass}`}>
                          {course.healthLabel.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{course.healthScore}%</span>
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${barClass}`} style={{ width: `${Math.min(100, Math.max(0, course.healthScore))}%` }} />
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="rounded-lg bg-white/70 dark:bg-slate-950/25 p-1.5">
                        <p className="text-slate-400 dark:text-slate-500">Enrollments</p>
                        <p className="font-semibold">{course.enrollments}</p>
                      </div>
                      <div className="rounded-lg bg-white/70 dark:bg-slate-950/25 p-1.5">
                        <p className="text-slate-400 dark:text-slate-500">Completion</p>
                        <p className="font-semibold">{Math.round(course.completionRate)}%</p>
                      </div>
                      <div className="rounded-lg bg-white/70 dark:bg-slate-950/25 p-1.5">
                        <p className="text-slate-400 dark:text-slate-500">Attendance</p>
                        <p className="font-semibold">{Math.round(course.attendanceRate)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes forecast-card-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .forecast-card {
          animation: forecast-card-in 420ms ease-out both;
        }

        .forecast-card-sm {
          transition: none;
        }
      `}</style>
    </div>
  );
}


