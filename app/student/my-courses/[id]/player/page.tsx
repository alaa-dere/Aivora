'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const mockLessons = [
  { id: 'l1', title: 'Intro', type: 'video' as const },
  { id: 'l2', title: 'Components', type: 'video' as const },
  { id: 'l3', title: 'Props & State', type: 'pdf' as const },
];

export default function CoursePlayerPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-4">
        <Link
          href="/student/my-courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
            Course Player — {params.id}
          </h1>

          <div className="rounded-xl border border-blue-100 dark:border-blue-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              (Demo) Here will be the video/pdf viewer.
            </p>

            <div className="mt-4 h-64 rounded-lg bg-gray-100 dark:bg-gray-900 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Player Area
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
              Mark lesson as completed
            </button>
            <Link
              href={`/student/my-courses/${params.id}/quizzes`}
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
            >
              Go to Quiz
            </Link>
          </div>
        </div>

        {/* Lessons list */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Lessons</h2>
          <div className="space-y-2">
            {mockLessons.map((l) => (
              <button
                key={l.id}
                className="w-full text-left p-3 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-white">{l.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{l.type.toUpperCase()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}