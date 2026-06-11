'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

type StudentPath = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  level?: string;
  price?: number;
  estimatedHours?: number;
  estimatedWeeks?: number;
  categoryName?: string | null;
  coursesCount?: number;
  enrolled?: boolean;
};

export default function StudentPathsPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<StudentPath[]>([]);

  useEffect(() => {
    const loadPaths = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/student/paths', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load paths');
        }
        setPaths(Array.isArray(data?.paths) ? data.paths : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load paths');
      } finally {
        setLoading(false);
      }
    };

    loadPaths();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return paths;
    return paths.filter((path) => {
      const text = [path.title, path.description || '', path.categoryName || '', path.level || '']
        .join(' ')
        .toLowerCase();
      return text.includes(query);
    });
  }, [paths, q]);

  return (
    <div className="min-h-screen w-full bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Explore Paths</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse structured learning paths and enroll step-by-step.
        </p>
      </div>

      <div className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, level, category..."
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading paths...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          filtered.map((path) => (
            <div
              key={path.id}
              className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
            >
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={path.imageUrl || '/default-course.jpg'}
                  alt={path.title}
                  className="h-36 w-full object-cover"
                />
              </div>

              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className="text-base leading-snug font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {path.title}
                </h3>
                {path.enrolled ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                    Enrolled
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {path.description || 'No description provided yet.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <BookOpenIcon className="w-3.5 h-3.5" />
                  {Number(path.coursesCount || 0)} Courses
                </span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {Number((path.estimatedWeeks ?? path.estimatedHours) || 0)} Weeks
                </span>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <Link
                  href={path.enrolled ? `/student/paths/${path.id}` : `/Home/paths/${path.id}/enroll`}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    path.enrolled
                      ? 'bg-transparent border border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {path.enrolled ? 'View Path' : 'Pay & Enroll'}
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-base font-bold text-gray-900 dark:text-white bg-white/70 dark:bg-slate-800/40">
                  ${Number(path.price || 0).toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No paths match your search.
        </div>
      )}
    </div>
  );
}
