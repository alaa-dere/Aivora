'use client';

import { useEffect, useState } from 'react';
import {
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type LeaderboardRow = {
  id: string;
  fullName: string;
  minutesLast7: number;
  minutesPrev7: number;
  improvement: number;
  rank: number;
};

type LeaderboardResponse = {
  top: LeaderboardRow[];
  current: LeaderboardRow | null;
  totalStudents: number;
  metric: string;
};

const formatMinutes = (value: number) => {
  const mins = Math.round(Number(value || 0));
  return `${mins} min`;
};

export default function StudentLeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/student/leaderboard', { cache: 'no-store' });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.message || 'Failed to load leaderboard');
        }
        if (mounted) {
          setData(payload);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Failed to load leaderboard');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Leaderboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ranked by improvement in time spent (last 7 days vs previous 7 days).
        </p>
      </div>

      {loading && (
        <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-10 text-center text-gray-500 dark:text-gray-300">
          Loading leaderboard...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center text-red-700 dark:text-red-200 flex items-center justify-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your position</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {data.current ? `#${data.current.rank}` : '—'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Improvement</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {data.current ? `${data.current.improvement >= 0 ? '+' : ''}${data.current.improvement}` : '—'} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Last 7 days</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {data.current ? formatMinutes(data.current.minutesLast7) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Previous 7 days</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {data.current ? formatMinutes(data.current.minutesPrev7) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total students</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {data.totalStudents}
                  </span>
                </div>
              </div>
            </div>

            <div className="portal-surface mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">How it works</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                We compare your time spent in the last 7 days against the previous 7
                days. The bigger the increase, the higher your rank.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Top 10 Students
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{data.metric}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Rank</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Improvement</th>
                      <th className="px-4 py-3 font-medium">Last 7 Days</th>
                      <th className="px-4 py-3 font-medium">Prev 7 Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.top.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                          No leaderboard data yet.
                        </td>
                      </tr>
                    ) : (
                      data.top.map((row) => {
                        const isCurrent = data.current?.id === row.id;
                        const trendUp = row.improvement >= 0;
                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              isCurrent
                                ? 'bg-blue-50/70 dark:bg-blue-900/30'
                                : 'hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                              #{row.rank}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {row.fullName || 'Student'}
                              </div>
                              {isCurrent && (
                                <div className="text-xs text-blue-600 dark:text-blue-300">
                                  You
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  trendUp
                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                }`}
                              >
                                {trendUp ? (
                                  <ArrowUpIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownIcon className="w-3.5 h-3.5" />
                                )}
                                {row.improvement >= 0 ? '+' : ''}
                                {row.improvement} min
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                              {formatMinutes(row.minutesLast7)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                              {formatMinutes(row.minutesPrev7)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {data.current && !data.top.some((row) => row.id === data.current?.id) && (
              <div className="portal-surface mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  You are currently ranked{' '}
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    #{data.current.rank}
                  </span>
                  . Keep going to break into the top 10!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
