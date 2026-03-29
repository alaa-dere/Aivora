'use client';

import Link from 'next/link';
import { PlayCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

type CourseItem = {
  id: string;
  title: string;
  description?: string;
  progress: number;
  imageUrl?: string;
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMyCourses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/my-courses', { cache: 'no-store' });
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

    loadMyCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          My Courses
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : courses.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="relative overflow-hidden rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-950 mb-4">
              <img
                src={c.imageUrl || '/default-course.jpg'}
                alt={c.title}
                className="h-32 w-full object-cover opacity-80"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-950/30 to-transparent" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const threshold = ((idx + 1) / 10) * 100;
                  const active = c.progress >= threshold;
                  return (
                    <span
                      key={`${c.id}-dot-${idx}`}
                      className={`block h-3.5 w-3.5 rounded-full border transition-all ${
                        active
                          ? 'border-blue-300 bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.9)]'
                          : 'border-blue-400/50 bg-blue-900/50'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="absolute right-3 top-3">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/90 text-blue-900">
                  {c.progress}%
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <PlayCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-800 dark:text-white">{c.title}</h3>
              </div>
            </div>

            <div className="mt-3 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${c.progress}%` }} />
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href={`/student/my-courses/${c.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Open Course <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
