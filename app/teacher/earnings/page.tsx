'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

type EarningsSummary = {
  totalRevenue: number;
  monthRevenue: number;
  grossSales: number;
};

type EarningsTx = {
  id: string;
  dateTime: string;
  type: 'enrollment' | 'refund';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  teacherShare: number;
  studentName: string | null;
  courseTitle: string | null;
};

export default function TeacherEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalRevenue: 0,
    monthRevenue: 0,
    grossSales: 0,
  });
  const [transactions, setTransactions] = useState<EarningsTx[]>([]);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/teacher/earnings', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load earnings');
        }
        setSummary(data.summary || { totalRevenue: 0, monthRevenue: 0, grossSales: 0 });
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const fmtCurrency = (value: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const pendingPayouts = Math.max(0, summary.totalRevenue - summary.grossSales);

  const cards = useMemo(
    () => [
      { label: 'My Total Revenue', value: fmtCurrency(summary.totalRevenue), icon: CurrencyDollarIcon },
      { label: 'This Month Revenue', value: fmtCurrency(summary.monthRevenue), icon: ChartBarIcon },
      { label: 'Gross Sales (My Courses)', value: fmtCurrency(summary.grossSales), icon: ShoppingBagIcon },
      { label: 'Pending Payouts', value: fmtCurrency(pendingPayouts), icon: BanknotesIcon },
    ],
    [summary]
  );

  return (
    <div className="min-h-screen w-full bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Earnings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your earnings and sales from your courses.
        </p>
      </div>

      {error ? (
        <div className="portal-surface rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {card.icon && <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '...' : card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="portal-surface rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Transactions</h2>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">My Share</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 align-top">{new Date(tx.dateTime).toLocaleString()}</td>
                    <td className="px-4 py-3 align-top">{tx.courseTitle || '-'}</td>
                    <td className="px-4 py-3 align-top">{tx.studentName || '-'}</td>
                    <td className="px-4 py-3 align-top capitalize">{tx.type}</td>
                    <td className="px-4 py-3 align-top capitalize">{tx.status}</td>
                    <td className="px-4 py-3 text-right align-top">{fmtCurrency(tx.amount, tx.currency || 'USD')}</td>
                    <td className="px-4 py-3 text-right align-top">{fmtCurrency(tx.teacherShare, tx.currency || 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
