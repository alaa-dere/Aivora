'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import {
  SunIcon,
  MoonIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

type Course = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  teacherName: string;
  teacherId: string;
  durationWeeks: number;
  teacherSharePct: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  students: number;
};

export default function AllCoursesPage() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        setErrorMsg(null);

        const res = await fetch('/api/courses', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load courses');
        }

        const publishedCourses = (data.courses || []).filter(
          (course: Course) => course.status === 'published'
        );

        setCourses(publishedCourses);
      } catch (error: any) {
        setErrorMsg(error.message || 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = mounted && theme === 'dark';

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return courses;

    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(query) ||
        course.teacherName.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
    });
  }, [courses, searchQuery]);

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[filter] duration-500"
        style={{
          backgroundImage: isDark ? "url('/plain2dd.png')" : "url('/plain2.png')",
          backgroundPosition: '50% 50%',
          filter: isDark
            ? 'brightness(0.85) saturate(1.05)'
            : 'brightness(1.05) saturate(1.0)',
        }}
      />

      <div
        className={`fixed inset-0 -z-10 transition-opacity duration-500 ${
          isDark ? 'bg-black/25' : 'bg-white/20'
        }`}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/" className="flex items-center shrink-0">
              <AcademicCapIcon className="w-8 h-8 text-blue-950 dark:text-blue-400 mr-2" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Aivora
              </h1>
            </Link>

            <div className="flex-1 min-w-[200px] max-w-md mx-4 order-3 md:order-none w-full md:w-auto mt-3 md:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 dark:bg-slate-800/60 border border-slate-300/30 dark:border-slate-600/40 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                )}
              </button>

              <Link href="/Home">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Back to Home</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-8 pb-16 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto">
              Explore our complete collection of courses in programming, AI, design, marketing, and more.
            </p>
          </div>

          {loadingCourses ? (
            <div className="text-center py-20 text-slate-300 text-xl">
              Loading courses...
            </div>
          ) : errorMsg ? (
            <div className="text-center py-20 text-red-300 text-xl">
              {errorMsg}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 text-slate-300 text-xl">
              No courses found matching your search.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={course.imageUrl || '/default-course.jpg'}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-sm text-blue-200 mb-2 font-medium">
                      By {course.teacherName}
                    </p>

                    <h3 className="text-lg font-bold text-white mb-3 leading-snug line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-sm text-slate-300 mb-4 line-clamp-2 min-h-[40px]">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-slate-200 mb-4">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-blue-300" />
                        {course.durationWeeks} Weeks
                      </div>

                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4 text-blue-300" />
                        {course.students}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-blue-300">
                        ${course.price}
                      </span>

                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/10 hover:bg-blue-600 text-white text-sm font-semibold border border-white/15 transition-all duration-300"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}