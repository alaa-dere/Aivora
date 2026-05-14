'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

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

type RevenuePoint = {
  week: string;
  revenue: number;
};

function money(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function AdminFinanceForecastPage() {
  const [loading, setLoading] = useState(true);
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
    aiDebug: null as { provider: 'openai' | 'none'; status?: number; code?: string; message?: string } | null,
  });
  const [trend, setTrend] = useState<RevenuePoint[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = `month=${encodeURIComponent(month)}`;

        const [forecastRes, trendRes] = await Promise.all([
          fetch(`/api/admin/ai/revenue-forecast?${query}`, { cache: 'no-store' }),
          fetch(`/api/dashboard/revenue-trend?${query}`, { cache: 'no-store' }),
        ]);

        const forecastData = await forecastRes.json();
        const trendData = await trendRes.json();

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
          aiDebug: forecastData.aiDebug || null,
        });

        setTrend(Array.isArray(trendData?.trend) ? trendData.trend : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [month]);

  const trendPercentLabel = useMemo(() => `${Math.round((forecast.trendPct || 0) * 100)}%`, [forecast.trendPct]);
  const trendUp = forecast.trendPct >= 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/finance/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back To Reports
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Finance Forecast</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep view of projected revenue, trend movement, and AI recommendations.
          </p>
        </div>
        <div className="text-right">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="admin-surface forecast-card relative h-full min-h-[150px] overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md"
          style={{ animationDelay: '0ms' }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Projected Next Month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{money(forecast.forecastMonthly)}</p>
        </div>
        <div
          className="admin-surface forecast-card relative h-full min-h-[150px] overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md"
          style={{ animationDelay: '90ms' }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">4-Week Trend</p>
          <div className="mt-2 flex items-center gap-2">
            {trendUp ? (
              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowTrendingDownIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{trendPercentLabel}</p>
          </div>
        </div>
        <div
          className="admin-surface forecast-card relative h-full min-h-[150px] overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md"
          style={{ animationDelay: '180ms' }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Recent Window Revenue</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">Last 4 weeks: {money(forecast.last4Total)}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">Previous 4 weeks: {money(forecast.prev4Total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface forecast-card lg:col-span-2 relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Revenue Trend (12 weeks)</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">{loading ? 'Loading...' : 'Updated live'}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="week" tick={{ fill: '#334155', fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fill: '#334155', fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#forecastTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-surface forecast-card relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top Courses (Recent)</p>
          <div className="mt-4 space-y-3">
            {forecast.topCourses.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No course revenue data yet.</p>
            ) : (
              forecast.topCourses.map((course) => (
                <div key={course.title} className="forecast-card forecast-card-sm rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/80 dark:bg-slate-900/55">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{course.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Revenue: {money(course.revenue)} | Enrollments: {course.count}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 admin-surface forecast-card relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">AI Insights Breakdown</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(forecast.insights || []).map((insight, index) => {
            const Icon =
              insight.type === 'forecast'
                ? SparklesIcon
                : insight.type === 'recommendation'
                  ? AcademicCapIcon
                  : insight.description.toLowerCase().includes('down')
                    ? ArrowTrendingDownIcon
                    : ArrowTrendingUpIcon;

            return (
              <div key={`${insight.title}-${index}`} className="forecast-card forecast-card-sm h-full min-h-[140px] rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/80 dark:bg-slate-900/55">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Icon className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{insight.title}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{insight.description}</p>
              </div>
            );
          })}
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
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .forecast-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
        }

        .forecast-card-sm {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .forecast-card-sm:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
        }
      `}</style>
    </div>
  );
}
