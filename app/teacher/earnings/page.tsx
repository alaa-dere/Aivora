'use client';

import { useEffect, useMemo, useState } from 'react';

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

  const cards = useMemo(
    () => [
      { label: 'My Total Revenue', value: fmtCurrency(summary.totalRevenue) },
      { label: 'This Month Revenue', value: fmtCurrency(summary.monthRevenue) },
      { label: 'Gross Sales (My Courses)', value: fmtCurrency(summary.grossSales) },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="portal-surface rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-5"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
              {loading ? '...' : card.value}
            </p>
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
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Course</th>
                  <th className="text-left">Student</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">My Share</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.dateTime).toLocaleString()}</td>
                    <td>{tx.courseTitle || '-'}</td>
                    <td>{tx.studentName || '-'}</td>
                    <td className="capitalize">{tx.type}</td>
                    <td className="capitalize">{tx.status}</td>
                    <td className="text-right">{fmtCurrency(tx.amount, tx.currency || 'USD')}</td>
                    <td className="text-right">{fmtCurrency(tx.teacherShare, tx.currency || 'USD')}</td>
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
