'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

type TxStatus = 'success' | 'failed' | 'pending';

type Payout = {
  id: string;
  date: string;
  teacherName?: string;
  status: TxStatus;
  amount: number;
  method?: 'wallet' | 'card' | 'cash';
};

function money(n: number) {
  return `$${Math.abs(n).toLocaleString()}`;
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

export default function AdminFinancePayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TxStatus>('all');
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/finance/payouts?month=${encodeURIComponent(month)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load payouts');
        }
        setPayouts(data.payouts || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load payouts');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [month]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return payouts.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesMonth = p.date.startsWith(month);
      const hay = [p.id, p.teacherName ?? '', p.method ?? '', p.status]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || hay.includes(query);
      return matchesStatus && matchesMonth && matchesQuery;
    });
  }, [payouts, q, statusFilter, month]);

  const stats = useMemo(() => {
    const monthPayouts = payouts;
    const total = monthPayouts.reduce((sum, p) => sum + Math.abs(p.amount), 0);
    const success = monthPayouts.filter((p) => p.status === 'success').length;
    const pending = monthPayouts.filter((p) => p.status === 'pending').length;
    const failed = monthPayouts.filter((p) => p.status === 'failed').length;

    return { total, success, pending, failed, count: monthPayouts.length };
  }, [payouts, month]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Finance - Payouts
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total payouts', value: money(stats.total), icon: BanknotesIcon },
          { label: 'Successful', value: stats.success.toString(), icon: CheckCircleIcon },
          { label: 'Pending', value: stats.pending.toString(), icon: ClockIcon },
          { label: 'Failed', value: stats.failed.toString(), icon: XCircleIcon },
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
                placeholder="Search by id / teacher / method..."
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

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Payouts <span className="text-gray-400 font-normal">({filtered.length})</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Month count: <span className="font-semibold">{stats.count}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    Loading payouts...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-500">
                    {errorMsg}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                    {p.teacherName ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.date}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.method ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadge(p.status)}`}>
                      {p.status === 'success' ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : p.status === 'failed' ? (
                        <XCircleIcon className="w-4 h-4" />
                      ) : (
                        <ClockIcon className="w-4 h-4" />
                      )}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                    {money(p.amount)}
                  </td>
                  </tr>
                ))
              )}

              {!loading && !errorMsg && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No payouts found.
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
