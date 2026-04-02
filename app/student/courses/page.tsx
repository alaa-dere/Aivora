'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  UserCircleIcon,
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
  lessonCount: number;
  studentCount: number;
  averageRating?: number;
  evaluationCount?: number;
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
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
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Explore Courses
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Discover new courses and start learning today.
        </p>
      </div>

      {/* Search */}
      <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, teacher, keyword..."
              className="portal-surface w-full pl-10 pr-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : filtered.map((c) => {
          const rating = Number(c.averageRating || 0);
          const reviewCount = Number(c.evaluationCount || 0);
          const filledStars = Math.round(rating);

          return (
            <div
              key={c.id}
              className="portal-surface bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <div className="overflow-hidden rounded-xl">
                <img
                  src={c.imageUrl || '/default-course.jpg'}
                  alt={c.title}
                  className="h-44 w-full object-cover"
                />
              </div>

              <div className="mt-4">
                <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 text-xs font-semibold">
                  #Skill Building
                </span>

                <h3 className="mt-3 text-xl leading-snug font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {c.title}
                </h3>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-700/70 px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
                  <UserCircleIcon className="w-4 h-4" />
                  <span className="font-medium">{c.teacherName}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <BookOpenIcon className="w-4 h-4" />
                    {Math.max(1, c.lessonCount)} Lessons
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {Math.max(1, c.durationWeeks)} Week
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <StarIcon
                      key={`${c.id}-star-${idx}`}
                      className={`w-4 h-4 ${idx < filledStars ? 'fill-current' : ''}`}
                    />
                  ))}
                  {reviewCount > 0 ? (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {rating.toFixed(1)} ({reviewCount} Reviews)
                    </span>
                  ) : (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">No reviews yet</span>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link
                    href={`/student/courses/${c.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
                  >
                    {c.enrolled ? 'Continue Course' : 'Join Our Class'}
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-lg font-bold text-gray-900 dark:text-white">
                    ${c.price}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No courses match your search.
        </div>
      )}
    </div>
  );
}
