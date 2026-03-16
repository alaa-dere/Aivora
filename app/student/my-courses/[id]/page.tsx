'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LockClosedIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  unlocked: boolean;
};

type Module = {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
};

export default function StudentCourseOverviewPage() {
  const params = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/my-courses/${params.id}/content`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load course content');
        }
        setModules(data.modules || []);
        setCourseTitle(data.course?.title || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load course content');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadContent();
  }, [params.id]);

  const firstUnlocked = useMemo(() => {
    for (const mod of modules) {
      const lesson = mod.lessons.find((l) => l.unlocked && !l.completed) || mod.lessons[0];
      if (lesson?.unlocked) return lesson;
    }
    return null;
  }, [modules]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          {courseTitle || 'Course Overview'}
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading course...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{module.title}</h2>
                {module.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">
                    {module.description}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        lesson.unlocked
                          ? 'border-blue-200 dark:border-blue-800'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lesson.durationMinutes} min
                        </p>
                      </div>
                      {lesson.unlocked ? (
                        <Link
                          href={`/student/my-courses/${params.id}/player?lesson=${lesson.id}`}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <PlayCircleIcon className="w-4 h-4" /> Open
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <LockClosedIcon className="w-4 h-4" /> Locked
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Continue</h3>
              {firstUnlocked ? (
                <Link
                  href={`/student/my-courses/${params.id}/player?lesson=${firstUnlocked.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  <PlayCircleIcon className="w-4 h-4" />
                  Resume Lesson
                </Link>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No unlocked lessons yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
