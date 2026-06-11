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
import CourseFavoriteButton from '@/components/course-favorite-button';

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
  paidViaPath?: boolean;
};

export default function StudentCoursesPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await fetch('/api/student/favorites/ids', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setFavoriteIds(new Set((data.ids || []) as string[]));
        }
      } catch {
        // ignore
      }
    };

    loadFavorites();
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

  const updateFavorite = (courseId: string, next: boolean) => {
    setFavoriteIds((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(courseId);
      else nextSet.delete(courseId);
      return nextSet;
    });
  };

  return (
    <div className="min-h-screen w-full bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Explore Courses
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Discover new courses and start learning today.
        </p>
      </div>

      {/* Search */}
      <div className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, teacher, keyword..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            />
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
              className="portal-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={c.imageUrl || '/default-course.jpg'}
                  alt={c.title}
                  className="h-32 w-full object-cover"
                />
                <CourseFavoriteButton
                  courseId={c.id}
                  initialFavorite={favoriteIds.has(c.id)}
                  onChange={(next) => updateFavorite(c.id, next)}
                  className="absolute top-3 right-3 h-8 w-8"
                />
              </div>

              <div className="mt-3 flex flex-1 flex-col">
                <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 text-[11px] font-semibold">
                  #Skill Building
                </span>

                <h3 className="mt-2 text-sm leading-snug font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {c.title}
                </h3>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-700/70 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                  <UserCircleIcon className="w-3.5 h-3.5" />
                  <span className="font-medium">{c.teacherName}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <BookOpenIcon className="w-3.5 h-3.5" />
                    {Math.max(1, c.lessonCount)} Lessons
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {Math.max(1, c.durationWeeks)} Week
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <StarIcon
                      key={`${c.id}-star-${idx}`}
                      className={`w-3.5 h-3.5 ${idx < filledStars ? 'fill-current' : ''}`}
                    />
                  ))}
                  {reviewCount > 0 ? (
                    <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {rating.toFixed(1)} ({reviewCount} Reviews)
                    </span>
                  ) : (
                    <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">No reviews yet</span>
                  )}
                </div>

                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/student/courses/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-semibold transition-colors"
                    >
                      {c.enrolled ? 'Continue Course' : 'Join Our Class'}
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                    {c.paidViaPath && !c.enrolled ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        Paid via Path
                      </span>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-base font-bold text-gray-900 dark:text-white bg-white/70 dark:bg-slate-800/40">
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
