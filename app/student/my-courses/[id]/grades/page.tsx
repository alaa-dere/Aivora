'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type ChapterAttempt = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  submittedAt: string;
};

type FinalAttempt = {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  submittedAt: string;
};

export default function QuizGradesPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [courseTitle, setCourseTitle] = useState('Course');
  const [chapterAttempts, setChapterAttempts] = useState<ChapterAttempt[]>([]);
  const [finalAttempts, setFinalAttempts] = useState<FinalAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/my-courses/${courseId}/quiz-grades`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load quiz grades');
        setCourseTitle(String(data?.course?.title || 'Course'));
        setChapterAttempts(Array.isArray(data?.chapterAttempts) ? data.chapterAttempts : []);
        setFinalAttempts(Array.isArray(data?.finalAttempts) ? data.finalAttempts : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz grades');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) load();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-4">
        <Link
          href={`/student/my-courses/${courseId}/player`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Course
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">Quiz Grades</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{courseTitle}</p>

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading grades...</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Chapter Quiz Attempts</h2>
            {!chapterAttempts.length ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No chapter attempts yet.</p>
            ) : (
              <div className="space-y-2">
                {chapterAttempts.map((item) => (
                  <div key={item.id} className="rounded-lg border border-blue-100 dark:border-blue-800 p-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{item.moduleTitle}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {item.scorePercentage.toFixed(2)}% ({item.correctAnswers}/{item.totalQuestions}) -{' '}
                      {new Date(item.submittedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Final Course Quiz Attempts</h2>
            {!finalAttempts.length ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No final quiz attempts yet.</p>
            ) : (
              <div className="space-y-2">
                {finalAttempts.map((item) => (
                  <div key={item.id} className="rounded-lg border border-blue-100 dark:border-blue-800 p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {item.scorePercentage.toFixed(2)}% ({item.correctAnswers}/{item.totalQuestions}) -{' '}
                      {new Date(item.submittedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

