'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
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
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading course...
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Course not found</h1>
        <p className="text-slate-300 mb-6">{errorMsg || 'This course does not exist.'}</p>
        <Link
          href="/courses"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-semibold"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium"
          >
            <AcademicCapIcon className="w-5 h-5" />
            All Courses
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
            <img
              src={course.imageUrl || '/default-course.jpg'}
              alt={course.title}
              className="w-full h-[260px] sm:h-[380px] object-cover"
            />
          </div>

          <div>
            <p className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium border border-blue-400/20">
              {course.status}
            </p>

            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              {course.title}
            </h1>

            <p className="text-slate-300 text-lg leading-8 mb-6">
              {course.description}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400 mb-1">Instructor</p>
                <p className="font-semibold text-white">{course.teacherName}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400 mb-1">Price</p>
                <p className="font-semibold text-blue-300 text-xl">${course.price}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                <ClockIcon className="w-6 h-6 text-blue-300" />
                <div>
                  <p className="text-sm text-slate-400">Duration</p>
                  <p className="font-semibold text-white">{course.durationWeeks} Weeks</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                <UserGroupIcon className="w-6 h-6 text-blue-300" />
                <div>
                  <p className="text-sm text-slate-400">Students</p>
                  <p className="font-semibold text-white">{course.students}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-8">
              <p className="text-sm text-slate-400 mb-2">Created At</p>
              <p className="text-white font-medium">{course.createdAt}</p>
            </div>

            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white text-lg font-semibold shadow-lg">
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}