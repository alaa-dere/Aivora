// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
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

// الإحصائيات الرئيسية
const statCards = [
  {
    key: 'totalStudents',
    name: 'Total Students',
    icon: UserGroupIcon,
  },
  {
    key: 'totalTeachers',
    name: 'Total Teachers',
    icon: AcademicCapIcon,
  },
  {
    key: 'activeCourses',
    name: 'Active Courses',
    icon: BookOpenIcon,
  },
  {
    key: 'monthlyRevenue',
    name: 'Monthly Revenue',
    icon: CurrencyDollarIcon,
  },
] as const;

// بيانات الرسم البياني للإيرادات (آخر 12 أسبوعًا)
type RevenuePoint = { week: string; revenue: number };

// Transactions from DB
type RecentTx = {
  id: string;
  name: string;
  amount: number;
  dateTime: string;
};

function formatMoney(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Recent activity from DB
type RecentActivity = {
  type: 'ENROLL';
  description: string;
  time: string;
};

// رؤى الذكاء الاصطناعي (بألوان زرقاء)
const aiInsights = [
  {
    title: 'Forecast',
    description: 'Next month React Basics +18%',
    icon: ArrowTrendingUpIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Risk',
    description: 'At-risk Web Dev student based on quiz performance',
    icon: ArrowTrendingDownIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Recommendation',
    description: 'JavaScript Async (68% wrong) needs review',
    icon: AcademicCapIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeCourses: 0,
    monthlyRevenue: 0,
  });
  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        setStats({
          totalStudents: Number(data.totalStudents || 0),
          totalTeachers: Number(data.totalTeachers || 0),
          activeCourses: Number(data.activeCourses || 0),
          monthlyRevenue: Number(data.monthlyRevenue || 0),
        });
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      }
    }

    loadStats();
  }, []);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        setTxLoading(true);
        const res = await fetch('/api/finance/transactions', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;

        const list = (data.transactions || []).slice(0, 3).map((t: any) => ({
          id: t.id,
          name: t.studentName || t.teacherName || t.courseTitle || 'Unknown',
          amount: Number(t.amount || 0),
          dateTime: t.dateTime || t.date || '',
        }));
        setRecentTx(list);
      } catch (error) {
        console.error('Failed to load recent transactions', error);
      } finally {
        setTxLoading(false);
      }
    };

    loadRecent();
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setActivityLoading(true);
        const res = await fetch('/api/dashboard/recent-activity', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;
        setRecentActivities(data.activities || []);
      } catch (error) {
        console.error('Failed to load recent activity', error);
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivity();
  }, []);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        setRevenueLoading(true);
        const res = await fetch('/api/dashboard/revenue-trend', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;
        setRevenueData(data.trend || []);
      } catch (error) {
        console.error('Failed to load revenue trend', error);
      } finally {
        setRevenueLoading(false);
      }
    };

    loadRevenue();
  }, []);

  const formattedStats = useMemo(
    () => ({
      totalStudents: stats.totalStudents.toLocaleString(),
      totalTeachers: stats.totalTeachers.toLocaleString(),
      activeCourses: stats.activeCourses.toLocaleString(),
      monthlyRevenue: `$${stats.monthlyRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    }),
    [stats]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* رأس الصفحة */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of key metrics, revenue, and recent activity.
        </p>
      </div>

      {/* بطاقات الإحصائيات مع تأثير hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {formattedStats[stat.key]}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* الرسم البياني ورؤى الذكاء الاصطناعي مع تأثير hover */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* الرسم البياني للإيرادات - موجة زرقاء */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Revenue Trend
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Last 12 weeks</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bfdbfe" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fill: '#1e3a8a' }} 
                  stroke="#1e3a8a"
                />
                <YAxis 
                  tick={{ fill: '#1e3a8a' }} 
                  stroke="#1e3a8a"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {revenueLoading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading revenue trend...</p>
          )}
        </div>

        {/* رؤى الذكاء الاصطناعي مع تأثير hover */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            AI Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Smart analytics & suggestions
          </p>
          <div className="space-y-4">
            {aiInsights.map((insight) => (
              <div key={insight.title} className="flex gap-3">
                <div className={`${insight.bg} p-2 rounded-lg h-fit`}>
                  <insight.icon className={`w-5 h-5 ${insight.color}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* المعاملات الأخيرة وآخر الأنشطة مع تأثير hover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {txLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : recentTx.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
            ) : (
              recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-800 last:border-0"
                >
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {tx.name}
                    </span>
                    {tx.dateTime && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tx.dateTime}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Live platform events</p>
          <div className="space-y-4">
            {activityLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity.</p>
            ) : (
              recentActivities.map((activity, idx) => (
                <div key={idx} className="flex gap-3">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {activity.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{activity.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(activity.time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
