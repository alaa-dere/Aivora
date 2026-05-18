'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type ReportResponse = {
  income: number;
  teacherProfit: number;
  platformProfit: number;
  byType: Record<string, number>;
  count: number;
  aiSource: 'openai' | 'rule-based';
  aiForecast: number;
  aiTrendText: string;
  aiDebug: { provider: 'openai' | 'none'; status?: number; code?: string; message?: string } | null;
};

function money(n: number) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString()}`;
}

export default function AdminFinanceReportsPage() {
  const [report, setReport] = useState<ReportResponse>({
    income: 0,
    teacherProfit: 0,
    platformProfit: 0,
    byType: {},
    count: 0,
    aiSource: 'rule-based',
    aiForecast: 0,
    aiTrendText: '',
    aiDebug: null,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

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

        setReport({
          income: Number(data.income || 0),
          teacherProfit: Number(data.teacherProfit || 0),
          platformProfit: Number(data.platformProfit || 0),
          byType: data.byType || {},
          count: Number(data.count || 0),
          aiSource: data.aiSource === 'openai' ? 'openai' : 'rule-based',
          aiForecast: Number(data.aiForecast || 0),
          aiTrendText: String(data.aiTrendText || ''),
          aiDebug: data.aiDebug || null,
        });
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
    const header = ['metric,value'];
    const rows = [
      ['income', stats.income],
      ['teacher_profit', stats.teacherProfit],
      ['platform_profit', stats.platformProfit],
      ['enrollment_count', stats.byType.enrollment ?? 0],
      ['total_count', stats.count],
    ].map((r) => r.join(','));

    const csv = [...header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_report_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Monthly finance summary with exportable metrics.</p>
          <Link
            href="/dashboard/finance/forecast"
            className="inline-flex mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Forecast
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Loading report...' : errorMsg ? errorMsg : 'Monthly summary'}
          </div>
          <button
            onClick={() => window.print()}
            className="admin-surface inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/70 text-blue-700 dark:text-blue-300 font-semibold text-[11px] sm:text-xs border border-slate-200 dark:border-slate-800 shadow-md transition-all duration-200 active:scale-95"
          >
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-[11px] sm:text-xs shadow-md border border-blue-500/50 transition-all duration-200 active:scale-95"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          { label: 'Income', value: money(stats.income), icon: CurrencyDollarIcon },
          { label: 'Teacher Profit', value: money(stats.teacherProfit), icon: Squares2X2Icon },
          { label: 'Platform Profit', value: money(stats.platformProfit), icon: Squares2X2Icon },
        ].map((card, idx) => (
          <div
            key={card.label}
            className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-6 min-h-[120px] sm:min-h-[140px] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 animate-[fadeIn_.4s_ease-out_both]"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transactions By Type</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Enrollments</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.byType.enrollment ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.count}</span>
            </div>
          </div>
        </div>

        <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Profit Split Summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Teacher profit</span>
              <span className="font-semibold text-gray-900 dark:text-white">{money(stats.teacherProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Platform profit</span>
              <span className="font-semibold text-gray-900 dark:text-white">{money(stats.platformProfit)}</span>
            </div>
          </div>
        </div>

        <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Forecast</p>
          </div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-2">
            Source: {stats.aiSource === 'openai' ? 'OpenAI' : 'Rule-based'}
          </p>
          {stats.aiSource === 'rule-based' && stats.aiDebug?.message ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              AI fallback reason: {stats.aiDebug.message}
            </p>
          ) : null}
          <div className="mt-4 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 p-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Expected revenue: {money(Math.round(stats.aiForecast || stats.income))}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Trend: {stats.aiTrendText || 'Not enough data yet.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
