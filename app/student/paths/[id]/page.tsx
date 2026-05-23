'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

type PathCourseProgress = {
  id: string;
  orderNumber: number;
  title: string;
  imageUrl?: string;
  teacherName: string;
  durationWeeks: number;
  progressPercentage: number;
  status: 'completed' | 'in_progress' | 'not_started';
  paidViaPath: boolean;
};

type PathOverview = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
};

export default function StudentPathDetailsPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<PathOverview | null>(null);
  const [courses, setCourses] = useState<PathCourseProgress[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/student/paths/${params.id}/courses`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load path');
        }
        setPath(data?.path || null);
        setCourses(Array.isArray(data?.courses) ? data.courses : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load path');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) load();
  }, [params.id]);

  const currentCourseId = useMemo(() => {
    const active = courses.find((course) => course.status === 'in_progress');
    if (active) return active.id;
    const next = courses.find((course) => course.status === 'not_started');
    return next?.id || null;
  }, [courses]);
  const allCoursesCompleted = useMemo(
    () => courses.length > 0 && courses.every((course) => course.status === 'completed'),
    [courses]
  );

  if (loading) {
    return <div className="min-h-screen p-4 md:p-6 text-sm text-gray-500 dark:text-gray-400">Loading path...</div>;
  }

  if (error || !path) {
    return <div className="min-h-screen p-4 md:p-6 text-sm text-red-500">{error || 'Path not found'}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="mb-5">
        <Link
          href="/student/paths"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Explore Paths
        </Link>
      </div>

      <div className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md mb-6">
        <div className="h-48 sm:h-60 overflow-hidden">
          <img src={path.imageUrl || '/default-course.jpg'} alt={path.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{path.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {path.description || 'No description provided yet.'}
          </p>
          {allCoursesCompleted && (
            <div className="mt-4">
              <Link
                href={`/student/paths/${params.id}/quiz`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Take Final Path Quiz (15 Questions)
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No courses found in this path.</div>
        ) : (
          courses.map((course) => {
            const isCurrent = currentCourseId === course.id;
            return (
              <div
                key={course.id}
                className="portal-surface rounded-xl border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-4 flex flex-col"
              >
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={course.imageUrl || '/default-course.jpg'}
                    alt={course.title}
                    className="w-full h-36 object-cover"
                  />
                </div>

                <div className="mt-3 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">Step {course.orderNumber}</p>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-1 line-clamp-2">
                        {course.title}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        By {course.teacherName} - {course.durationWeeks} weeks
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        Paid via Path
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          You are here
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${
                          course.status === 'completed'
                            ? 'bg-emerald-500'
                            : course.status === 'in_progress'
                              ? 'bg-blue-500'
                              : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, Number(course.progressPercentage || 0)))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {course.status === 'completed'
                          ? 'Completed'
                          : course.status === 'in_progress'
                            ? 'In progress'
                            : 'Not started yet'}
                      </span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {Number(course.progressPercentage || 0)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={
                        course.status === 'in_progress' || course.status === 'completed'
                          ? `/student/my-courses/${course.id}`
                          : `/student/courses/${course.id}`
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      {course.status === 'in_progress' || course.status === 'completed'
                        ? 'Continue Course'
                        : 'Open Course'}
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
