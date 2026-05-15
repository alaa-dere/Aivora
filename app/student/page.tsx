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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/dashboard', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load dashboard');
        }
        setStats(data.stats);
        setStudyData(data.studyData || []);
        setContinueLearning(data.continueLearning || []);
        setRecentQuizzes(data.recentQuizzes || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bfdbfe" />
                <XAxis dataKey="day" tick={{ fill: '#1e3a8a' }} stroke="#1e3a8a" />
                <YAxis
                  tick={{ fill: '#1e3a8a' }}
                  stroke="#1e3a8a"
                  tickFormatter={(value) => `${value}m`}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#1e3a8a', offset: 0 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  labelStyle={{ color: '#1e293b' }}
                  formatter={(value: number) => [`${value} min`, 'Study Time']}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#studyGradient)"
                  name="Study Time"
                >
                  <LabelList dataKey="minutes" position="top" formatter={(value: number) => `${value}m`} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Tip: Aim for 45-60 minutes daily for steady progress.
          </p>
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

          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : recentQuizzes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No quizzes yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {recentQuizzes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{q.course}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{q.date}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {q.score}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
