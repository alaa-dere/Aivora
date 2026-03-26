'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  durationWeeks: number;
  teacherName: string;
  teacherId: string;
  price: number;
  teacherSharePct: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  students: number;
};

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const { theme, setTheme } = useTheme();
  const { status } = useSession();

  const [mounted, setMounted] = useState(false);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch(`/api/courses/${courseId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load course');
        }

        setCourse(data.course);
      } catch (error: any) {
        setErrorMsg(error.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const buildReturnUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('enroll', '1');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrollError(null);
    setEnrollSuccess(null);

    setEnrolling(true);
    try {
      const res = await fetch(`/api/student/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentConfirmed: true, method: 'card' }),
      });

      if (res.status === 401 || res.status === 403) {
        const next = buildReturnUrl();
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to enroll');
      }

      setEnrollSuccess('Enrollment successful.');
      router.push(`/student/my-courses/${courseId}`);
    } catch (err: any) {
      setEnrollError(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => {
    const enrollFlag = searchParams.get('enroll');
    if (enrollFlag === '1' && status === 'authenticated') {
      void handleEnroll();
    }
  }, [searchParams, status, courseId]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = mounted && theme === 'dark';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        Loading course...
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-white px-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Course not found</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {errorMsg || 'This course does not exist.'}
        </p>
        <Link
          href="/Home/courses"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-semibold"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[filter] duration-500"
        style={{
          backgroundImage: isDark ? "url('/plain2dd.png')" : "url('/plain2.png')",
          backgroundPosition: '50% 50%',
          filter: isDark ? 'brightness(0.85) saturate(1.05)' : 'brightness(1.05) saturate(1.0)',
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
              <Image
                src="/alaa.png"
                alt="Aivora Logo"
                width={100}
                height={35}
                className="h-7 w-auto dark:brightness-100 brightness-25"
              />
            </Link>

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

              <Link href="/Home/courses">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Back to Courses</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-8 pb-16 px-5 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-900 dark:text-white transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-lg shadow-xl">
              <img
                src={course.imageUrl || '/default-course.jpg'}
                alt={course.title}
                className="w-full h-[260px] sm:h-[380px] object-cover"
              />
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 text-white">
                {course.title}
              </h1>

              <p className="text-slate-200 text-lg leading-8 mb-6 whitespace-pre-line">
                {course.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4">
                  <p className="text-sm text-slate-300 mb-1">Instructor</p>
                  <p className="font-semibold text-white">{course.teacherName}</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4">
                  <p className="text-sm text-slate-300 mb-1">Price</p>
                  <p className="font-semibold text-blue-300 text-xl">${course.price}</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4 flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-blue-300" />
                  <div>
                    <p className="text-sm text-slate-300">Duration</p>
                    <p className="font-semibold text-white">{course.durationWeeks} Weeks</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4 flex items-center gap-3">
                  <UserGroupIcon className="w-6 h-6 text-blue-300" />
                  <div>
                    <p className="text-sm text-slate-300">Students</p>
                    <p className="font-semibold text-white">{course.students}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-5 mb-8">
                <p className="text-sm text-slate-300 mb-2">Created At</p>
                <p className="text-white font-medium">{course.createdAt}</p>
              </div>

              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white text-lg font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>

              {(enrollError || enrollSuccess) && (
                <div className="mt-4">
                  {enrollError && (
                    <p className="text-sm text-red-400">{enrollError}</p>
                  )}
                  {enrollSuccess && (
                    <p className="text-sm text-emerald-300">{enrollSuccess}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
