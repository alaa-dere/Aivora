'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

type QuizItem = { id: string; title: string };
type CourseItem = { courseId: string; courseTitle: string; quizzes: QuizItem[] };

export default function CertificateQuizzesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/certificate-quizzes', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load quizzes');
        setCourses(data.courses || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Certificate Quizzes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete these quizzes to unlock your certificate.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don’t have any pending certificate quizzes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.courseId}
              className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <AcademicCapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {course.courseTitle}
                </h2>
              </div>

              <div className="space-y-2">
                {course.quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between rounded-lg border border-blue-100 dark:border-blue-800 px-4 py-3"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-200">{quiz.title}</span>
                    <Link
                      href={`/student/my-courses/${course.courseId}/quizzes`}
                      className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline"
                    >
                      Go to quizzes
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
