'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BanknotesIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type TeacherProfile = {
  id: string;
  fullName: string;
  email: string;
};

type EarningsSummary = {
  totalRevenue: number;
  monthRevenue: number;
  grossSales: number;
};

type TransactionRow = {
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
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileRes = await fetch('/api/teacher/profile', { cache: 'no-store' });
        const profileData = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profileData.message || 'Failed to load profile');
        }

        const teacher = profileData.teacher as TeacherProfile;
        setProfile(teacher);

        const statsRes = await fetch(`/api/teachers?id=${teacher.id}`, { cache: 'no-store' });
        const statsData = await statsRes.json();
        if (!statsRes.ok) {
          throw new Error(statsData.message || 'Failed to load earnings');
        }

        setSummary({
          totalRevenue: Number(statsData?.stats?.totalRevenue || 0),
          monthRevenue: Number(statsData?.stats?.monthRevenue || 0),
          grossSales: Number(statsData?.stats?.grossSales || 0),
        });
        setTransactions((statsData?.transactions || []) as TransactionRow[]);
      } catch (err: any) {
        setError(err.message || 'Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const money = (value: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);

  const availableBalance = useMemo(
    () => (summary ? summary.totalRevenue : 0),
    [summary]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading earnings...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-2">
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Unable to load earnings</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error || 'Please try again later.'}</p>
        <Link
          href="/teacher"
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Earnings & Withdrawals
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your revenue, view recent payouts, and request withdrawals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Available balance',
            value: money(availableBalance),
            icon: BanknotesIcon,
            note: 'Balance updates after enrollment payments are confirmed.',
          },
          {
            title: 'This month',
            value: money(summary.monthRevenue),
            icon: CalendarDaysIcon,
            note: 'Revenue since the first day of this month.',
          },
          {
            title: 'Gross sales',
            value: money(summary.grossSales),
            icon: CreditCardIcon,
            note: 'Total course sales before platform share.',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{stat.note}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Recent payouts
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Last 12 transactions</span>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col gap-2 rounded-xl border border-blue-100 dark:border-blue-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {tx.courseTitle || 'Course'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tx.studentName || 'Student'} • {new Date(tx.dateTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        tx.status === 'success'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : tx.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {money(tx.teacherShare, tx.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ArrowDownTrayIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Withdraw funds
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Withdrawals are processed manually by the admin team.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>1. Make sure your profile email is correct for payout confirmation.</p>
            <p>2. Request your withdrawal via admin message with the amount you want to cash out.</p>
            <p>3. Payouts are usually completed within 2-5 business days.</p>
          </div>

          <div className="mt-5 rounded-lg border border-blue-100 dark:border-blue-900 p-4 text-xs text-gray-500 dark:text-gray-400">
            Need to update payout details? Go to your{' '}
            <Link href="/teacher/profile" className="text-blue-600 dark:text-blue-300 hover:underline">
              profile page
            </Link>{' '}
            and edit your contact info.
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link
              href="/teacher/messages"
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Message admin to withdraw
            </Link>
            <Link
              href="/teacher/profile"
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              Update profile
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
