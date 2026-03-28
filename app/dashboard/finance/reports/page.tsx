'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CurrencyDollarIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

function money(n: number) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString()}`;
}

export default function AdminFinanceReportsPage() {
  const [report, setReport] = useState({
    income: 0,
    teacherProfit: 0,
    platformProfit: 0,
    byType: {} as Record<string, number>,
    count: 0,
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
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load reports');
        }
        setReport({
          income: Number(data.income || 0),
          teacherProfit: Number(data.teacherProfit || 0),
          platformProfit: Number(data.platformProfit || 0),
          byType: data.byType || {},
          count: Number(data.count || 0),
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load reports');
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
      ['refund_count', stats.byType.refund ?? 0],
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly finance summary with exportable metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading report...' : errorMsg ? errorMsg : 'Monthly summary'}
          </div>
          <button
            onClick={exportCSV}
            className="
              group inline-flex items-center gap-2
              px-4 py-2 rounded-xl
              bg-gradient-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              text-white font-semibold text-xs
              shadow-sm hover:shadow-md
              border border-blue-500/50
              transition-all duration-200
              active:scale-95
            "
          >
            <ArrowDownTrayIcon className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
            Download
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Income', value: money(stats.income), icon: CurrencyDollarIcon },
          { label: 'Teacher profit', value: money(stats.teacherProfit), icon: Squares2X2Icon },
          { label: 'Platform profit', value: money(stats.platformProfit), icon: Squares2X2Icon },
        ].map((card) => (
          <div
            key={card.label}
            className="
              bg-white dark:bg-gray-800
              rounded-xl
              border border-blue-200 dark:border-blue-800
              shadow-sm
              p-5
              hover:-translate-y-1 hover:shadow-lg
              transition-all duration-200
            "
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transactions by type</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Enrollments</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.byType.enrollment ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Refunds</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.byType.refund ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Profit split summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Teacher profit</span>
              <span className="font-semibold text-gray-900 dark:text-white">{money(stats.teacherProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Platform profit</span>
              <span className="font-semibold text-gray-900 dark:text-white">{money(stats.platformProfit)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Connect this to real payments when finance tables are ready.
          </p>
        </div>
      </div>
    </div>
  );
}
