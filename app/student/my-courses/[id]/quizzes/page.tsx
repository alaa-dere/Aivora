'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

type QuizItem = {
  id: string;
  title: string;
  attempts: number;
  lastScore?: number; // undefined يعني ما قدّم
  status: 'not_started' | 'completed';
  lastAttemptLabel?: string;
};

const mockQuizzes: QuizItem[] = [
  {
    id: 'q1',
    title: 'Quiz 1 — Basics',
    attempts: 2,
    lastScore: 85,
    status: 'completed',
    lastAttemptLabel: '2 days ago',
  },
  {
    id: 'q2',
    title: 'Quiz 2 — Hooks',
    attempts: 0,
    status: 'not_started',
  },
  {
    id: 'q3',
    title: 'Quiz 3 — Components',
    attempts: 1,
    lastScore: 78,
    status: 'completed',
    lastAttemptLabel: '1 week ago',
  },
];

export default function CourseQuizzesPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [playerHref, setPlayerHref] = useState(`/student/my-courses/${courseId}/player`);

  useEffect(() => {
    try {
      const savedLessonId = localStorage.getItem(`aivora:last-lesson:${courseId}`) || '';
      if (savedLessonId) {
        setPlayerHref(`/student/my-courses/${courseId}/player?lesson=${savedLessonId}`);
      }
    } catch {
      // ignore storage errors
    }
  }, [courseId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-4">
        <Link
          href="/student/my-courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to My Courses
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Quizzes — {courseId}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View your results or start a new attempt.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <div className="space-y-3">
          {mockQuizzes.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                    <ChartBarIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{q.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Attempts: {q.attempts}
                      {q.lastAttemptLabel ? ` • Last: ${q.lastAttemptLabel}` : ''}
                    </p>
                  </div>
                </div>

                {q.status === 'completed' ? (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {q.lastScore}% (Completed)
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    Not started
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {q.status === 'completed' ? (
                  <Link
                    href={`/student/my-courses/${courseId}/quizzes/${q.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View result <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => alert('Demo: start quiz flow here')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    Start quiz <ArrowRightIcon className="w-4 h-4" />
                  </button>
                )}

                <Link
                  href={playerHref}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                >
                  Back to player
                </Link>
              </div>
            </div>
          ))}
        </div>

        {mockQuizzes.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
            No quizzes for this course yet.
          </div>
        )}
      </div>
    </div>
  );
}
