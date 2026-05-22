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
  imageUrl?: string | null;
  minutesAllTime: number;
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

const formatMinutes = (value: number) => `${Math.round(Number(value || 0))} min`;
const rankMedal = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '🏅';
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
        if (!res.ok) throw new Error(payload?.message || 'Failed to load leaderboard');
        if (mounted) setData(payload);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const topThree = data?.top.slice(0, 3) || [];
  const restRows = data?.top.slice(3) || [];

  const podiumHeightByRank = (rank: number) => {
    if (rank === 1) return 'h-44';
    if (rank === 2) return 'h-36';
    return 'h-32';
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 px-4 py-5 sm:px-6 sm:py-6 shadow-md backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
        <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-cyan-200/30 dark:bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-blue-600 dark:text-blue-300">Leaderboard</p>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mt-1">Top Learners Arena</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Ranked by improvement in the last 7 days versus the previous 7 days.
            </p>
          </div>
          <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            This Week
          </span>
        </div>

        {loading && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-10 text-center text-slate-600 dark:text-slate-300">
            Loading leaderboard...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-center text-red-100 flex items-center justify-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 sm:p-6">
                  <div className="flex items-end justify-center gap-3 sm:gap-5 min-h-[220px]">
                    {topThree.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-300 py-8">No leaderboard data yet.</div>
                    ) : (
                    [topThree[1], topThree[0], topThree[2]].filter(Boolean).map((row) => {
                        const isChampion = row.rank === 1;
                          const theme = isChampion
                            ? 'from-amber-100 to-white border-amber-200 dark:from-amber-900/30 dark:to-slate-900/80 dark:border-amber-700/40'
                            : row.rank === 2
                            ? 'from-sky-100 to-white border-sky-200 dark:from-sky-900/25 dark:to-slate-900/80 dark:border-sky-700/40'
                            : 'from-indigo-100 to-white border-indigo-200 dark:from-indigo-900/25 dark:to-slate-900/80 dark:border-indigo-700/40';
                          const glow = isChampion ? 'shadow-md' : 'shadow-sm';
                          const currentUser = data.current?.id === row.id;

                        return (
                          <div key={row.id} className="flex flex-col items-center gap-2 animate-[fadein_.5s_ease]">
                            <div className={`w-24 sm:w-28 rounded-2xl border bg-gradient-to-b ${theme} ${glow} p-2 text-center`}>
                              <div className="text-lg leading-none">{rankMedal(row.rank)}</div>
                              <div className="mx-auto mt-1 h-12 w-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                                {row.imageUrl ? (
                                  <img src={row.imageUrl} alt={row.fullName || 'Student'} className="h-full w-full object-cover" />
                                ) : (
                                  <UserCircleIcon className="w-7 h-7 text-slate-500 dark:text-slate-300" />
                                )}
                              </div>
                              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">#{row.rank}</p>
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{row.fullName || 'Student'}</p>
                              <p className="text-sm sm:text-lg font-black text-blue-700 dark:text-blue-300 mt-1">
                                {row.improvement >= 0 ? '+' : ''}
                                {row.improvement}
                                <span className="text-[10px] sm:text-xs font-semibold ml-1 text-slate-500 dark:text-slate-400">pts</span>
                              </p>
                              {currentUser && <p className="text-[10px] text-blue-600 dark:text-blue-300 mt-1">You</p>}
                            </div>
                            <div className={`w-24 sm:w-28 rounded-t-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 ${podiumHeightByRank(row.rank)}`} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 order-1 lg:order-2">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {data.current?.imageUrl ? (
                        <img src={data.current.imageUrl} alt={data.current.fullName || 'Student'} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <UserCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Your position</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{data.current ? `#${data.current.rank}` : '—'}</p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Improvement</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {data.current ? `${data.current.improvement >= 0 ? '+' : ''}${data.current.improvement}` : '-'} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Last 7 days</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{data.current ? formatMinutes(data.current.minutesLast7) : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">All time</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{data.current ? formatMinutes(data.current.minutesAllTime) : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total students</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{data.totalStudents}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Top 10 Students</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{data.metric}</span>
              </div>
              <div className="space-y-2 p-3 sm:p-4">
                {data.top.length === 0 ? (
                  <div className="text-sm text-center text-slate-500 dark:text-slate-400 py-6">No leaderboard data yet.</div>
                ) : (
                  [...topThree, ...restRows].map((row) => {
                    const isCurrent = data.current?.id === row.id;
                    const isFlat = row.improvement === 0;
                    const trendUp = row.improvement > 0;
                    const progressWidth = Math.max(
                      8,
                      Math.min(
                        100,
                        Math.round((Math.abs(row.improvement) / Math.max(1, Math.abs(data.top[0]?.improvement || 1))) * 100)
                      )
                    );
                    return (
                      <div
                        key={row.id}
                        className={`rounded-xl border p-3 sm:p-4 transition-all duration-300 ${
                          isCurrent
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/25'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="text-sm font-black text-slate-700 dark:text-slate-200 w-8">#{row.rank}</div>
                            <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
                              {row.imageUrl ? (
                                <img src={row.imageUrl} alt={row.fullName || 'Student'} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{(row.fullName || 'S').trim().charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">{row.fullName || 'Student'}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatMinutes(row.minutesLast7)} this week</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${
                                trendUp
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/40'
                                  : isFlat
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                                  : 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/40'
                              }`}
                            >
                              {!isFlat && (trendUp ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                              {row.improvement >= 0 ? '+' : ''}
                              {row.improvement} pts
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              trendUp ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-rose-400 to-fuchsia-500'
                            }`}
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How Ranking Works</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                We compare your learning minutes in the last 7 days against the previous 7 days.
                The bigger your improvement, the higher your rank.
              </p>
            </div>

            {data.current && !data.top.some((row) => row.id === data.current?.id) && (
              <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  You are currently ranked <span className="font-semibold">#{data.current.rank}</span>. Keep going to break into the top 10.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
