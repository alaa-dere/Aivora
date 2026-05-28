'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
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
  type: string;
  description: string;
  time: string;
};

function formatRelativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Since now';
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `Since ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Since ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Since ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Since ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Since ${months}mo`;
  const years = Math.floor(months / 12);
  return `Since ${years}y`;
}

function getActivityAppearance(type: string) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('enroll')) {
    return {
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      border: 'border-blue-200/80 dark:border-blue-900/40',
      hover: 'hover:bg-blue-50/60 dark:hover:bg-blue-900/20',
      iconWrap: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      icon: UserGroupIcon,
    };
  }
  if (normalized.includes('course')) {
    return {
      badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-900/40',
      hover: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20',
      iconWrap: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      icon: BookOpenIcon,
    };
  }
  return {
    badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
    border: 'border-violet-200/80 dark:border-violet-900/40',
    hover: 'hover:bg-violet-50/60 dark:hover:bg-violet-900/20',
    iconWrap: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    icon: SparklesIcon,
  };
}

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
    previousMonthRevenue: 0,
    monthlyRevenueChangePct: 0,
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
  const [aiDebug, setAiDebug] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (!res.ok || !mounted) return;

        const data = await res.json();
        if (!mounted) return;
        setStats({
          totalStudents: Number(data.totalStudents || 0),
          totalTeachers: Number(data.totalTeachers || 0),
          activeCourses: Number(data.activeCourses || 0),
          monthlyRevenue: Number(data.monthlyRevenue || 0),
          previousMonthRevenue: Number(data.previousMonthRevenue || 0),
          monthlyRevenueChangePct: Number(data.monthlyRevenueChangePct || 0),
        });
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      }
    }

    loadStats();
    const onFocus = () => loadStats();
    window.addEventListener('focus', onFocus);
    const id = setInterval(loadStats, 20000);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
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
    let mounted = true;
    const loadRevenue = async () => {
      try {
        setRevenueLoading(true);
        const res = await fetch('/api/dashboard/revenue-trend', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !mounted) return;
        setRevenueData(data.trend || []);
      } catch (error) {
        console.error('Failed to load revenue trend', error);
      } finally {
        if (mounted) setRevenueLoading(false);
      }
    };

    loadRevenue();
    const onFocus = () => loadRevenue();
    window.addEventListener('focus', onFocus);
    const id = setInterval(loadRevenue, 20000);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
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
        setAiDebug(typeof data?.aiDebug?.message === 'string' ? data.aiDebug.message : null);
        setAiSource(
          data.source === 'openai' || data.source === 'rule-based'
            ? data.source
            : 'unknown'
        );
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
      previousMonthRevenue: `$${stats.previousMonthRevenue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    }),
    [stats]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Overview of key metrics, revenue, and recent activity.
          </p>
        </div>
        <Link
          href="/dashboard/chatbot"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Open Admin Chatbot
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((stat, index) => (
          <Card
            key={stat.name}
            className="admin-surface dashboard-card relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 py-0 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl ring-1 ring-blue-200/70 dark:ring-blue-800/70">
                  <stat.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formattedStats[stat.key]}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.name}</p>
              {stat.key === 'monthlyRevenue' ? (
                <p
                  className={`text-xs mt-2 ${
                    stats.monthlyRevenueChangePct >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {stats.monthlyRevenueChangePct >= 0 ? '+' : ''}
                  {stats.monthlyRevenueChangePct.toFixed(1)}% vs last month
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="admin-surface dashboard-card revenue-trend lg:col-span-2 relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
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

        <Card className="admin-surface dashboard-card relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 py-0 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300" style={{ animationDelay: '260ms' }}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200">AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span>Smart analytics & suggestions</span>
            </div>
            <Link
              href="/dashboard/finance/forecast"
              className="inline-flex mb-4 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
            >
              Go to Forecast
            </Link>
            {aiSource === 'rule-based' && aiDebug && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                AI fallback reason: {aiDebug}
              </p>
            )}
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
                    <div className={`${bg} p-2 rounded-xl h-fit ring-1 ring-blue-200/70 dark:ring-blue-800/70`}>
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2">
        <div className="admin-surface dashboard-card relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '320ms' }}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {txLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : recentTx.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No transactions yet.</p>
            ) : (
              recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-blue-100/80 dark:border-blue-900/50 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 inline-block max-w-full truncate">
                      {tx.name}
                    </span>
                    {tx.courseTitle && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 truncate">
                        Course: {tx.courseTitle}
                      </p>
                    )}
                    {tx.dateTime && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tx.dateTime}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0 ml-2">
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-surface dashboard-card relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '380ms' }}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Live platform events</p>
          <div className="space-y-2">
            {activityLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
            ) : (
              recentActivities.map((activity, idx) => {
                const style = getActivityAppearance(activity.type);
                const ActivityIcon = style.icon;
                return (
                  <div
                    key={idx}
                    className={`flex gap-2.5 py-2 px-2.5 rounded-lg border bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm transition-colors ${style.border} ${style.hover}`}
                  >
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${style.iconWrap}`}>
                      <ActivityIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full h-fit ${style.badge}`}>
                      {activity.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-5">{activity.description}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 inline-flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatRelativeTime(activity.time)}
                      </p>
                    </div>
                  </div>
                );
              })
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
