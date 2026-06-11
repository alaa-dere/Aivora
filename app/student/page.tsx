// app/student/dashboard/page.tsx
'use client';

import {
  PlayCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useEffect, useState } from 'react';

type ContinueCourse = {
  id: string;
  title: string;
  progress: number;
  nextLesson: string;
};

type QuizRow = {
  id: string;
  course: string;
  date: string;
  score: number;
};

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    inProgress: 0,
    avgScore: 0,
    completion: 0,
  });
  const [studyData, setStudyData] = useState<{ day: string; minutes: number }[]>([]);
  const [continueLearning, setContinueLearning] = useState<ContinueCourse[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizRow[]>([]);
  const totalStudyMinutes = studyData.reduce((sum, item) => sum + Number(item?.minutes || 0), 0);
  const todayMinutes = Number(studyData[studyData.length - 1]?.minutes || 0);

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = async () => {
      try {
        if (!cancelled) setLoading(true);
        const res = await fetch('/api/student/dashboard', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load dashboard');
        }
        if (cancelled) return;
        setStats(data.stats);
        setStudyData(data.studyData || []);
        setContinueLearning(data.continueLearning || []);
        setRecentQuizzes(data.recentQuizzes || []);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    const refreshTimer = setInterval(loadDashboard, 30000);
    const onFocus = () => loadDashboard();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your learning stats, courses, and progress at a glance.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          {
            name: 'Enrolled Courses',
            value: stats.enrolledCourses.toString(),
            change: '+0',
            icon: BookOpenIcon,
          },
          {
            name: 'In Progress',
            value: stats.inProgress.toString(),
            change: '+0',
            icon: PlayCircleIcon,
          },
          {
            name: 'Avg Progress',
            value: `${stats.avgScore}%`,
            change: '+0',
            icon: ChartBarIcon,
          },
          {
            name: 'Completion',
            value: `${stats.completion}%`,
            change: '+0',
            icon: AcademicCapIcon,
          },
        ].map((stat) => (
          <div
            key={stat.name}
            className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
            </div>

            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Study Trend */}
      <div className="mb-6">
        <div className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Study Time Trend
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{todayMinutes} min</p>
            </div>
            <div className="rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">This week</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{totalStudyMinutes} min</p>
            </div>
          </div>

          <div className="h-48 sm:h-56 md:h-64">
            {loading ? (
              <div className="h-full w-full rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading study trend...</p>
              </div>
            ) : error ? (
              <div className="h-full w-full rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50/40 dark:bg-red-900/10 flex items-center justify-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : studyData.length === 0 || totalStudyMinutes === 0 ? (
              <div className="h-full w-full rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No study activity yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bfdbfe" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#1e3a8a', fontSize: 11 }}
                    stroke="#1e3a8a"
                    padding={{ left: 0, right: 0 }}
                  />
                  <YAxis
                    tick={{ fill: '#1e3a8a', fontSize: 11 }}
                    stroke="#1e3a8a"
                    tickFormatter={(value) => `${value}m`}
                    width={34}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                    labelStyle={{ color: '#1e293b' }}
                    formatter={(value: number | string | undefined) => [`${Number(value || 0)} min`, 'Study Time']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="url(#studyGradient)"
                    name="Study Time"
                    connectNulls
                    dot={{ r: 3, strokeWidth: 1.5, fill: '#3b82f6', stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  >
                    <LabelList dataKey="minutes" position="top" fontSize={10} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Tip: Aim for 45-60 minutes daily for steady progress.
          </p>
          {!loading && !error ? (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Total this week: {totalStudyMinutes} minutes
            </p>
          ) : null}
        </div>
      </div>

      {/* Continue Learning + Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Continue Learning */}
        <div className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Continue Learning
          </h2>

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : continueLearning.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No courses yet.</p>
            ) : (
              continueLearning.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{c.title}</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {c.progress}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-400"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Next lesson: <span className="text-gray-700 dark:text-gray-200">{c.nextLesson}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Quiz Results */}
        <div className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Quiz Results
          </h2>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : recentQuizzes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No quizzes yet.</p>
            ) : (
              recentQuizzes.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/40 p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {q.course}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {q.date}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {q.score}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Hint: Focus on topics where your score is below 80%.
          </p>
        </div>
      </div>
    </div>
  );
}
