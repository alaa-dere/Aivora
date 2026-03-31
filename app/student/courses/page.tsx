'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type Course = {
  id: string;
  title: string;
  teacherName: string;
  price: number;
  description: string;
  durationWeeks: number;
  imageUrl?: string;
  enrolled: boolean;
};

export default function StudentCoursesPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/courses', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load courses');
        }
        setCourses(data.courses || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      const matchQ =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.teacherName.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query);
      return matchQ;
    });
  }, [q, courses]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Explore Courses
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Discover new courses and start learning today.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, teacher, keyword..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="relative overflow-hidden rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-950 mb-4">
              <img
                src={c.imageUrl || '/default-course.jpg'}
                alt={c.title}
                className="h-28 w-full object-cover opacity-80"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-950/45 to-transparent" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <span
                    key={`${c.id}-decor-dot-${idx}`}
                    className={`block h-3.5 w-3.5 rounded-full border ${
                      idx < 3
                        ? 'border-blue-300 bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.8)]'
                        : 'border-blue-400/50 bg-blue-900/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {c.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Teacher: <span className="text-gray-700 dark:text-gray-200">{c.teacherName}</span>
                </p>
              </div>

              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                ${c.price}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{c.description}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                {c.durationWeeks} weeks
              </span>
              {c.enrolled && (
                <span className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                  Enrolled
                </span>
              )}
            </div>

            <div className="mt-5">
              <Link
                href={`/student/courses/${c.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open details <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No courses match your search.
        </div>
      )}
    </div>
  );
}
