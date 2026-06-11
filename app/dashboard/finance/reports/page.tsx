'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CurrencyDollarIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

type BreakdownRow = {
  title?: string;
  teacherName?: string;
  categoryName?: string;
  revenue: number;
  enrollments: number;
};

type ReportResponse = {
  month: string;
  previousMonth: string;
  income: number;
  teacherProfit: number;
  platformProfit: number;
  byType: Record<string, number>;
  count: number;
  previous: {
    income: number;
    teacherProfit: number;
    platformProfit: number;
    count: number;
  };
  deltas: {
    incomePct: number;
    teacherProfitPct: number;
    platformProfitPct: number;
    countPct: number;
  };
  topCourses: BreakdownRow[];
  topTeachers: BreakdownRow[];
  topCategories: BreakdownRow[];
  alerts: string[];
  aiSource: 'openai' | 'rule-based';
  aiForecast: number;
  aiTrendText: string;
  aiDebug: { provider: 'openai' | 'none'; status?: number; code?: string; message?: string } | null;
};

const emptyReport: ReportResponse = {
  month: '',
  previousMonth: '',
  income: 0,
  teacherProfit: 0,
  platformProfit: 0,
  byType: {},
  count: 0,
  previous: { income: 0, teacherProfit: 0, platformProfit: 0, count: 0 },
  deltas: { incomePct: 0, teacherProfitPct: 0, platformProfitPct: 0, countPct: 0 },
  topCourses: [],
  topTeachers: [],
  topCategories: [],
  alerts: [],
  aiSource: 'rule-based',
  aiForecast: 0,
  aiTrendText: '',
  aiDebug: null,
};

function money(n: number) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString()}`;
}

function deltaLabel(pct: number) {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export default function AdminFinanceReportsPage() {
  const [report, setReport] = useState<ReportResponse>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const generatedAt = useMemo(
    () =>
      new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        const res = await fetch(`/api/finance/reports?month=${encodeURIComponent(month)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load reports');

        setReport({ ...emptyReport, ...data });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [month]);

  const stats = useMemo(() => report, [report]);

  const exportCSV = () => {
    const lines: string[] = [];

    lines.push('Summary');
    lines.push('metric,value');
    lines.push(`month,${month}`);
    lines.push(`previous_month,${stats.previousMonth || ''}`);
    lines.push(`income,${stats.income}`);
    lines.push(`teacher_profit,${stats.teacherProfit}`);
    lines.push(`platform_profit,${stats.platformProfit}`);
    lines.push(`transactions_total,${stats.count}`);
    lines.push(`income_delta_pct,${stats.deltas.incomePct}`);
    lines.push(`teacher_delta_pct,${stats.deltas.teacherProfitPct}`);
    lines.push(`platform_delta_pct,${stats.deltas.platformProfitPct}`);
    lines.push('');

    lines.push('Top Courses');
    lines.push('title,revenue,enrollments');
    stats.topCourses.forEach((r) => lines.push(`"${r.title || ''}",${r.revenue},${r.enrollments}`));
    lines.push('');

    lines.push('Top Teachers');
    lines.push('teacher,revenue,enrollments');
    stats.topTeachers.forEach((r) => lines.push(`"${r.teacherName || ''}",${r.revenue},${r.enrollments}`));
    lines.push('');

    lines.push('Top Categories');
    lines.push('category,revenue,enrollments');
    stats.topCategories.forEach((r) => lines.push(`"${r.categoryName || ''}",${r.revenue},${r.enrollments}`));

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_report_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const profitSplitData = useMemo(
    () => [
      { name: 'Teacher', value: Number(stats.teacherProfit || 0) },
      { name: 'Platform', value: Number(stats.platformProfit || 0) },
    ],
    [stats.teacherProfit, stats.platformProfit]
  );

  const topCoursesChartData = useMemo(
    () =>
      stats.topCourses.slice(0, 5).map((item) => ({
        name: (item.title || 'Course').slice(0, 18),
        revenue: Number(item.revenue || 0),
      })),
    [stats.topCourses]
  );

  const kpiCompareData = useMemo(
    () => [
      { key: 'Income', current: stats.income, previous: stats.previous.income },
      { key: 'Teacher', current: stats.teacherProfit, previous: stats.previous.teacherProfit },
      { key: 'Platform', current: stats.platformProfit, previous: stats.previous.platformProfit },
    ],
    [stats]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="w-full max-w-[1500px] mx-auto">
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Monthly finance report ready for export and printing.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 px-2.5 py-1.5 shadow-sm">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent text-sm text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {loading ? 'Loading report...' : errorMsg ? errorMsg : 'Monthly summary'}
            </div>
            <button onClick={() => window.print()} className="admin-surface inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/70 text-blue-700 dark:text-blue-300 font-semibold text-[11px] sm:text-xs border border-slate-200 dark:border-slate-800 shadow-md transition-all duration-200 active:scale-95">
              <PrinterIcon className="w-4 h-4" />
              Print
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-[11px] sm:text-xs shadow-md border border-blue-500/50 transition-all duration-200 active:scale-95">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="print-head hidden print:block mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Aivora Finance Report</h2>
          <p className="text-sm text-slate-600 mt-1">Month: {month} | Generated: {generatedAt}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
          {[
            { label: 'Income', value: money(stats.income), icon: CurrencyDollarIcon, delta: stats.deltas.incomePct },
            { label: 'Teacher Profit', value: money(stats.teacherProfit), icon: Squares2X2Icon, delta: stats.deltas.teacherProfitPct },
            { label: 'Platform Profit', value: money(stats.platformProfit), icon: Squares2X2Icon, delta: stats.deltas.platformProfitPct },
            { label: 'Transactions', value: String(stats.count), icon: Squares2X2Icon, delta: stats.deltas.countPct },
          ].map((card, idx) => (
            <div key={card.label} className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md px-4 py-5 sm:px-5 sm:py-6 min-h-[152px] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 animate-[fadeIn_.4s_ease-out_both]" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.delta >= 0 ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-700 bg-rose-50 dark:bg-rose-900/20'}`}>
                  {deltaLabel(card.delta)}
                </span>
              </div>
              <p className="text-2xl leading-none font-bold text-gray-800 dark:text-white mt-2">{card.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">{card.label}</p>
            </div>
          ))}
        </div>

        {stats.alerts.length > 0 && (
          <div className="admin-surface no-print relative overflow-hidden bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl shadow-md border border-amber-200 dark:border-amber-800 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              <p className="font-semibold text-amber-800 dark:text-amber-300">Alerts</p>
            </div>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              {stats.alerts.map((alert, i) => (
                <li key={`${alert}-${i}`}> {alert}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-7">
          <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 xl:col-span-4">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Profit Split Chart</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={profitSplitData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    <Cell fill="#60a5fa" />
                    <Cell fill="#6ee7b7" />
                  </Pie>
                  <Tooltip formatter={(value: number | string | undefined) => money(Number(value || 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#60a5fa]" />
                <span>Teacher Profit</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#6ee7b7]" />
                <span>Platform Profit</span>
              </div>
            </div>
          </div>

          <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 xl:col-span-4">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Top Courses Revenue</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCoursesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ef" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number | string | undefined) => money(Number(value || 0))} />
                  <Bar dataKey="revenue" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 xl:col-span-4">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Current vs Previous</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ef" />
                  <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number | string | undefined) => money(Number(value || 0))} />
                  <Bar dataKey="previous" fill="#bfdbfe" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="current" fill="#6ee7b7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-7">
          <div className="admin-surface relative overflow-hidden bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 px-5 py-4">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <SparklesIcon className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Forecast</p>
            </div>
            {stats.aiSource === 'rule-based' && stats.aiDebug?.message ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">AI fallback reason: {stats.aiDebug.message}</p>
            ) : null}
            <div className="rounded-md border border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-900/15 px-3 py-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Expected revenue: {money(Math.round(stats.aiForecast || stats.income))}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Trend: {stats.aiTrendText || 'Not enough data yet.'}</p>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-head {
            display: block !important;
          }

          .admin-surface {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            background: #fff !important;
            backdrop-filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
