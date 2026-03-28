'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CurrencyDollarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type TxType = 'enrollment' | 'refund';

type Transaction = {
  id: string;
  date: string;
  studentName?: string;
  teacherName?: string;
  courseTitle?: string;
  type: TxType;
  amount: number;
  teacherShare?: number;
  platformShare?: number;
  method?: 'wallet' | 'card' | 'cash' | 'paypal';
};

function money(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  return `${sign}$${abs.toLocaleString()}`;
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

export default function AdminFinanceTransactionsPage() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TxType>('all');
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/finance/transactions?month=${encodeURIComponent(month)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load transactions');
        }
        setTx(data.transactions || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [month]);

  const stats = useMemo(() => {
    const monthTx = tx;

    const income = monthTx
      .filter((t) => Number(t.amount) > 0)
      .reduce((a, b) => a + Number(b.amount || 0), 0);

    const teacherProfit = monthTx
      .filter((t) => t.type === 'enrollment')
      .reduce((a, b) => a + Number(b.teacherShare || 0), 0);

    const platformProfit = monthTx
      .filter((t) => t.type === 'enrollment')
      .reduce((a, b) => a + Number(b.platformShare || 0), 0);

    return {
      income,
      teacherProfit,
      platformProfit,
      count: monthTx.length,
    };
  }, [tx, month]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return tx.filter((t) => {
      const matchesType = typeFilter === 'all' || t.type === typeFilter;

      const hay = [
        t.id,
        t.studentName ?? '',
        t.teacherName ?? '',
        t.courseTitle ?? '',
        t.type,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || hay.includes(query);
      return matchesType && matchesQuery;
    });
  }, [tx, q, typeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Transactions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor payments and refunds across the platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Income (month)', value: money(stats.income), icon: CurrencyDollarIcon },
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
              </select>
            </div>
          </div>
        </div>
      </div>

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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Split</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-500">
                    {errorMsg}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                    {t.studentName || t.teacherName || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.date}</td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${typeBadge(t.type)}`}>
                      {t.type}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {t.courseTitle ?? '-'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Student: {t.studentName ?? '-'} • Teacher: {t.teacherName ?? '-'}
                      </span>
                      <span className="text-xs text-gray-400">
                        Method: {t.method ?? '-'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {t.type === 'enrollment' ? (
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
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className={`px-4 py-3 text-right font-bold ${t.amount >= 0 ? 'text-gray-900 dark:text-white' : 'text-indigo-700 dark:text-indigo-300'}`}>
                    {money(t.amount)}
                  </td>
                  </tr>
                ))
              )}

              {!loading && !errorMsg && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
