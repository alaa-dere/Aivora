'use client';

import Link from 'next/link';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

type PathItem = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  coursesCount?: number;
  estimatedWeeks?: number;
  enrollmentStatus?: string | null;
  enrollmentProgressPercentage?: number;
  enrollmentCompletedAt?: string | null;
  enrolled?: boolean;
};

export default function MyPathsPage() {
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [view, setView] = useState<'in_progress' | 'completed' | 'all'>('in_progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMyPaths = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/paths', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load paths');
        }
        const onlyEnrolled = Array.isArray(data.paths)
          ? (data.paths as PathItem[]).filter((path) => Boolean(path.enrolled))
          : [];
        setPaths(onlyEnrolled);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load paths');
      } finally {
        setLoading(false);
      }
    };

    loadMyPaths();
  }, []);

  const completedCount = useMemo(
    () =>
      paths.filter((p) => {
        const status = String(p.enrollmentStatus || '').toLowerCase();
        const progress = Number(p.enrollmentProgressPercentage || 0);
        return status === 'completed' || progress >= 100 || Boolean(p.enrollmentCompletedAt);
      }).length,
    [paths]
  );

  const inProgressCount = useMemo(
    () =>
      paths.filter((p) => {
        const status = String(p.enrollmentStatus || '').toLowerCase();
        const progress = Number(p.enrollmentProgressPercentage || 0);
        return !(status === 'completed' || progress >= 100 || Boolean(p.enrollmentCompletedAt));
      }).length,
    [paths]
  );

  const visiblePaths = useMemo(() => {
    if (view === 'all') return paths;
    return paths.filter((p) => {
      const status = String(p.enrollmentStatus || '').toLowerCase();
      const progress = Number(p.enrollmentProgressPercentage || 0);
      const isCompleted = status === 'completed' || progress >= 100 || Boolean(p.enrollmentCompletedAt);
      return view === 'completed' ? isCompleted : !isCompleted;
    });
  }, [paths, view]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">My Paths</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your enrolled paths and continue your roadmap.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setView('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            view === 'in_progress'
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setView('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            view === 'completed'
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            view === 'all'
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          All ({paths.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading paths...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : visiblePaths.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === 'completed'
              ? 'No completed paths yet.'
              : view === 'in_progress'
                ? 'No paths in progress.'
                : 'No paths found.'}
          </p>
        ) : (
          visiblePaths.map((p) => {
            const progress = Number(p.enrollmentProgressPercentage || 0);
            const status = String(p.enrollmentStatus || '').toLowerCase();
            const isCompleted = status === 'completed' || progress >= 100 || Boolean(p.enrollmentCompletedAt);

            return (
              <div
                key={p.id}
                className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col h-full"
              >
                <div className="relative overflow-hidden rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                  <img
                    src={p.imageUrl || '/default-course.jpg'}
                    alt={p.title}
                    className="h-36 w-full object-cover"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    {isCompleted && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        Completed
                      </span>
                    )}
                    <span className="portal-surface text-xs font-semibold px-2 py-1 rounded-full bg-white/90 text-blue-900">
                      {progress}%
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 min-h-[52px]">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <h3 className="font-semibold text-gray-800 dark:text-white leading-6 line-clamp-2">{p.title}</h3>
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {p.description || 'No description provided yet.'}
                </p>

                <div className="mt-3 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${progress}%` }} />
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {Number(p.coursesCount || 0)} courses • {Number(p.estimatedWeeks || 0)} weeks
                </p>

                <div className="pt-4 mt-auto">
                  <Link
                    href={`/student/paths/${p.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    Open Path <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

