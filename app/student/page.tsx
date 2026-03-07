// app/student/dashboard/page.tsx
'use client';

import {
  PlayCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// KPIs للطالب
const stats = [
  {
    name: 'Enrolled Courses',
    value: '6',
    change: '+1 this month',
    icon: BookOpenIcon,
  },
  {
    name: 'In Progress',
    value: '3',
    change: '2 near completion',
    icon: PlayCircleIcon,
  },
  {
    name: 'Avg Quiz Score',
    value: '82%',
    change: '+4% improved',
    icon: ChartBarIcon,
  },
  {
    name: 'Wallet Balance',
    value: '$18.50',
    change: 'Top-up available',
    icon: CreditCardIcon,
  },
];

// Study time chart (آخر 7 أيام)
const studyData = [
  { day: 'Sat', minutes: 35 },
  { day: 'Sun', minutes: 55 },
  { day: 'Mon', minutes: 25 },
  { day: 'Tue', minutes: 70 },
  { day: 'Wed', minutes: 40 },
  { day: 'Thu', minutes: 80 },
  { day: 'Fri', minutes: 30 },
];

// Continue Learning
const continueLearning = [
  { id: 'c1', title: 'React Basics', progress: 72, nextLesson: 'Hooks (Part 2)' },
  { id: 'c2', title: 'HTML & CSS', progress: 92, nextLesson: 'Responsive Layout' },
  { id: 'c3', title: 'JavaScript Essentials', progress: 44, nextLesson: 'Async/Await' },
];

// Recent Quiz Results
const recentQuizzes = [
  { id: 'q1', course: 'React Basics', score: 85, date: '2 days ago' },
  { id: 'q2', course: 'JavaScript Essentials', score: 78, date: '5 days ago' },
  { id: 'q3', course: 'HTML & CSS', score: 92, date: '1 week ago' },
];

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
       
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {stat.change}
              </span>
            </div>

            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Study Trend */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
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
                <YAxis tick={{ fill: '#1e3a8a' }} stroke="#1e3a8a" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#studyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Tip: Aim for 45–60 minutes daily for steady progress.
          </p>
        </div>
      </div>

      {/* Continue Learning + Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Continue Learning */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Continue Learning
          </h2>

          <div className="space-y-4">
            {continueLearning.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
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
            ))}
          </div>
        </div>

        {/* Recent Quiz Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Quiz Results
          </h2>

          <div className="space-y-3">
            {recentQuizzes.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-800 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{q.course}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{q.date}</p>
                </div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {q.score}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Hint: Focus on topics where your score is below 80%.
          </p>
        </div>
      </div>
    </div>
  );
}