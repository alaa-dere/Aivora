'use client';

import { useMemo, useState } from 'react';
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type TxStatus = 'success' | 'failed' | 'pending';
type TxType = 'enrollment' | 'refund' | 'payout';

type Transaction = {
  id: string;
  date: string;
  studentName?: string;
  teacherName?: string;
  courseTitle?: string;
  type: TxType;
  status: TxStatus;
  amount: number;
  teacherShare?: number;
  platformShare?: number;
  method?: 'wallet' | 'card' | 'cash';
};

const initialTx: Transaction[] = [
  {
    id: 'TX-9001',
    date: '2026-02-20',
    studentName: 'Ahmad Saleh',
    teacherName: 'Mohammad Hasan',
    courseTitle: 'English Basics A1',
    type: 'enrollment',
    status: 'success',
    amount: 49,
    teacherShare: 29,
    platformShare: 20,
    method: 'card',
  },
  {
    id: 'TX-9002',
    date: '2026-02-19',
    studentName: 'Sara Ali',
    teacherName: 'Lina Omar',
    courseTitle: 'Math Fundamentals',
    type: 'enrollment',
    status: 'failed',
    amount: 39,
    teacherShare: 21,
    platformShare: 18,
    method: 'card',
  },
  {
    id: 'TX-9003',
    date: '2026-02-18',
    teacherName: 'Mohammad Hasan',
    type: 'payout',
    status: 'success',
    amount: -150,
    method: 'cash',
  },
  {
    id: 'TX-9004',
    date: '2026-02-17',
    studentName: 'Ahmad Saleh',
    teacherName: 'Mohammad Hasan',
    courseTitle: 'Programming JS for Beginners',
    type: 'enrollment',
    status: 'pending',
    amount: 79,
    teacherShare: 51,
    platformShare: 28,
    method: 'wallet',
  },
];

function money(n: number) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString()}`;
}

function statusBadge(status: TxStatus) {
  if (status === 'success') {
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
  }
  if (status === 'failed') {
    return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/40';
  }
  return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/40';
}

function typeBadge(type: TxType) {
  if (type === 'enrollment') {
    return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800';
  }
  if (type === 'refund') {
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
  return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800';
}

export default function AdminFinancePage() {
  const [tx, setTx] = useState<Transaction[]>(initialTx);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TxStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TxType>('all');
  const [month, setMonth] = useState<string>('2026-02');

  const stats = useMemo(() => {
    const monthTx = tx.filter((t) => t.date.startsWith(month));

    const income = monthTx
      .filter((t) => t.status === 'success' && t.amount > 0)
      .reduce((a, b) => a + b.amount, 0);

    const payouts = monthTx
      .filter((t) => t.status === 'success' && t.amount < 0)
      .reduce((a, b) => a + Math.abs(b.amount), 0);

    const teacherProfit = monthTx
      .filter((t) => t.status === 'success' && t.type === 'enrollment')
      .reduce((a, b) => a + (b.teacherShare ?? 0), 0);

    const platformProfit = monthTx
      .filter((t) => t.status === 'success' && t.type === 'enrollment')
      .reduce((a, b) => a + (b.platformShare ?? 0), 0);

    return {
      income,
      payouts,
      teacherProfit,
      platformProfit,
      count: monthTx.length,
    };
  }, [tx, month]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return tx.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;

      const hay = [
        t.id,
        t.studentName ?? '',
        t.teacherName ?? '',
        t.courseTitle ?? '',
        t.type,
        t.status,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || hay.includes(query);
      return matchesStatus && matchesType && matchesQuery;
    });
  }, [tx, q, statusFilter, typeFilter]);

  function exportCSV() {
    const header = [
      'id,date,type,status,amount,student,teacher,course,teacherShare,platformShare,method',
    ];
    const rows = filtered.map((t) =>
      [
        t.id,
        t.date,
        t.type,
        t.status,
        t.amount,
        t.studentName ?? '',
        t.teacherName ?? '',
        t.courseTitle ?? '',
        t.teacherShare ?? '',
        t.platformShare ?? '',
        t.method ?? '',
      ].join(',')
    );
    const csv = [...header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Finance
          </h1>
        </div>

        <button
          onClick={exportCSV}
          className="
            group inline-flex items-center gap-2
            px-5 py-2.5 rounded-xl
            bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            text-white font-semibold text-sm
            shadow-sm hover:shadow-md
            border border-blue-500/50
            transition-all duration-200
            active:scale-95
          "
        >
          <ArrowDownTrayIcon className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Income (month)', value: money(stats.income), trend: '+6.2%', icon: CurrencyDollarIcon },
          { label: 'Teacher profit', value: money(stats.teacherProfit), trend: '+1.4%', icon: Squares2X2Icon },
          { label: 'Platform profit', value: money(stats.platformProfit), trend: '+3.1%', icon: Squares2X2Icon },
          { label: 'Payouts', value: money(stats.payouts), trend: '+9.8%', icon: BanknotesIcon },
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
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {card.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by id / student / teacher / course..."
                className="w-full sm:w-96 pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>

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

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              >
                <option value="all">All types</option>
                <option value="enrollment">Enrollment</option>
                <option value="refund">Refund</option>
                <option value="payout">Payout</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="all">All status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Transactions <span className="text-gray-400 font-normal">({filtered.length})</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Month count: <span className="font-semibold">{stats.count}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Split</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-200">{t.id}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.date}</td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${typeBadge(t.type)}`}>
                      {t.type}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadge(t.status)}`}>
                      {t.status === 'success' ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : t.status === 'failed' ? (
                        <XCircleIcon className="w-4 h-4" />
                      ) : (
                        <ClockIcon className="w-4 h-4" />
                      )}
                      {t.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {t.courseTitle ?? '—'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Student: {t.studentName ?? '—'} • Teacher: {t.teacherName ?? '—'}
                      </span>
                      <span className="text-xs text-gray-400">
                        Method: {t.method ?? '—'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {t.type === 'enrollment' && t.status === 'success' ? (
                      <div className="text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <span>Teacher</span>
                          <span className="font-semibold">{money(t.teacherShare ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Platform</span>
                          <span className="font-semibold">{money(t.platformShare ?? 0)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className={`px-4 py-3 text-right font-bold ${t.amount >= 0 ? 'text-gray-900 dark:text-white' : 'text-indigo-700 dark:text-indigo-300'}`}>
                    {money(t.amount)}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Monthly report summary</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <p className="text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{money(stats.income)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <p className="text-gray-500 dark:text-gray-400">Teacher profit</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{money(stats.teacherProfit)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <p className="text-gray-500 dark:text-gray-400">Platform profit</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{money(stats.platformProfit)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <p className="text-gray-500 dark:text-gray-400">Payouts</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{money(stats.payouts)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          * Connect this to real payments + payout rules later (teacher share % from course settings).
        </p>
      </div>
    </div>
  );
}