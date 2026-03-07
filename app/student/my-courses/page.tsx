'use client';

import Link from 'next/link';
import { PlayCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const myCourses = [
  { id: 'c1', title: 'React Basics', progress: 72 },
  { id: 'c2', title: 'JavaScript Essentials', progress: 44 },
];

export default function MyCoursesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          My Courses
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {myCourses.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <PlayCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-800 dark:text-white">{c.title}</h3>
              </div>

              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {c.progress}%
              </span>
            </div>

            <div className="mt-3 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${c.progress}%` }} />
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href={`/student/my-courses/${c.id}/player`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Open Player <ArrowRightIcon className="w-4 h-4" />
              </Link>

              <Link
                href={`/student/my-courses/${c.id}/quizzes`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                Quizzes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}