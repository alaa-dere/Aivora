'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
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

// Revenue chart (last 12 weeks)
type RevenuePoint = { week: string; revenue: number };

type RecentTx = {
  id: string;
  name: string;
  courseTitle: string | null;
  amount: number;
  dateTime: string;
};

function formatMoney(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type RecentActivity = {
  type: 'ENROLL';
  description: string;
  time: string;
};

type AiInsight = {
  title: string;
  description: string;
  type: 'forecast' | 'trend' | 'recommendation';
};

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
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiSource, setAiSource] = useState<'openai' | 'rule-based' | 'unknown'>('unknown');
  const [aiError, setAiError] = useState<string | null>(null);

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

        const list = (data.transactions || []).slice(0, 4).map((t: any) => ({
          id: t.id,
          name: t.studentName || t.teacherName || t.courseTitle || 'Unknown',
          courseTitle: t.courseTitle || null,
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

  useEffect(() => {
    const loadAiInsights = async () => {
      try {
        setAiLoading(true);
        setAiError(null);
        const res = await fetch('/api/admin/ai/revenue-forecast', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          setAiError(data?.message || 'Failed to load AI insights');
          return;
        }
        setAiInsights(data.insights || []);
        setAiSource(data.source === 'openai' || data.source === 'rule-based' ? data.source : 'unknown');
      } catch (error) {
        console.error('Failed to load AI insights', error);
        setAiError('Failed to load AI insights');
      } finally {
        setAiLoading(false);
      }
    };

    loadAiInsights();
  }, []);

  const formattedStats = useMemo(
    () => ({
      totalStudents: stats.totalStudents.toLocaleString('en-US'),
      totalTeachers: stats.totalTeachers.toLocaleString('en-US'),
      activeCourses: stats.activeCourses.toLocaleString('en-US'),
      monthlyRevenue: `$${stats.monthlyRevenue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    }),
    [stats]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Overview of key metrics, revenue, and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className="admin-surface dashboard-card bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {formattedStats[stat.key]}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="admin-surface dashboard-card revenue-trend lg:col-span-2 bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Revenue Trend
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Last 12 weeks</span>
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
                <XAxis dataKey="week" tick={{ fill: '#1e3a8a' }} stroke="#1e3a8a" />
                <YAxis tick={{ fill: '#1e3a8a' }} stroke="#1e3a8a" />
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading revenue trend...</p>
          )}
        </div>

        <div className="admin-surface dashboard-card bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200" style={{ animationDelay: '260ms' }}>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            AI Insights
          </h2>
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
            <span>Smart analytics & suggestions</span>
            <span className="text-xs uppercase tracking-wide">
              Source: {aiSource === 'openai' ? 'OpenAI' : aiSource === 'rule-based' ? 'Rule-based' : 'Unknown'}
            </span>
          </div>
          <div className="space-y-4">
            {aiLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading insights...</p>
            ) : aiError ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{aiError}</p>
            ) : aiInsights.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No insights yet.</p>
            ) : (
              aiInsights.map((insight) => {
                const isDown = insight.type === 'trend' && insight.description.toLowerCase().includes('down');
                const icon =
                  insight.type === 'forecast'
                    ? SparklesIcon
                    : insight.type === 'recommendation'
                      ? AcademicCapIcon
                      : isDown
                        ? ArrowTrendingDownIcon
                        : ArrowTrendingUpIcon;
                const color = 'text-blue-600 dark:text-blue-400';
                const bg = 'bg-blue-100 dark:bg-blue-900/30';

                const Icon = icon;
                return (
                  <div key={insight.title} className="flex gap-3">
                    <div className={`${bg} p-2 rounded-lg h-fit`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {insight.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-surface dashboard-card bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200" style={{ animationDelay: '320ms' }}>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {txLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : recentTx.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No transactions yet.</p>
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
                    {tx.courseTitle && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Course: {tx.courseTitle}
                      </p>
                    )}
                    {tx.dateTime && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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

        <div className="admin-surface dashboard-card bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200" style={{ animationDelay: '380ms' }}>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Recent Activity
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Live platform events</p>
          <div className="space-y-4">
            {activityLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
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

      <style jsx global>{`
        @keyframes dashboard-fade-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes revenue-draw {
          0% {
            stroke-dashoffset: 1200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes revenue-fill {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .dashboard-card {
          animation: dashboard-fade-up 520ms ease-out both;
        }

        .revenue-trend .recharts-area-curve {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: revenue-draw 1200ms ease-out 120ms forwards;
        }

        .revenue-trend .recharts-area-area {
          opacity: 0;
          animation: revenue-fill 900ms ease-out 220ms forwards;
        }
      `}</style>
    </div>
  );
}
