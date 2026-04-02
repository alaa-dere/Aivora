'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, LockClosedIcon, PlayCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
  const lessonStorageKey = `aivora:last-lesson:${params.id}`;
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseProgress, setCourseProgress] = useState(0);
  const [courseStatus, setCourseStatus] = useState<string>('');
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string>('');
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
        setCourseProgress(Number(data.course?.progressPercentage || 0));
        setCourseStatus(String(data.course?.status || ''));
        setLastActiveLessonId(String(data.course?.lastActiveLessonId || ''));
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
  const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) || modules[0] || null,
    [modules, selectedModuleId]
  );
  const lessonsInSelectedModule = selectedModule?.lessons || [];
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const continueLesson = useMemo(() => {
    const nextRequiredLesson =
      allLessons.find((lesson) => lesson.unlocked && !lesson.completed) || null;
    return nextRequiredLesson || firstUnlocked;
  }, [allLessons, firstUnlocked]);

  useEffect(() => {
    if (!modules.length) return;
    const initialModule = modules[0];
    let localRememberedId = '';
    try {
      localRememberedId = localStorage.getItem(lessonStorageKey) || '';
    } catch {
      // ignore storage errors
    }
    const localRememberedLesson =
      allLessons.find((l) => l.id === localRememberedId && l.unlocked) || null;
    const rememberedLesson =
      allLessons.find((l) => l.id === lastActiveLessonId && l.unlocked) || null;
    const firstUnlockedLesson = allLessons.find((l) => l.unlocked) || allLessons[0];
    const nextRequiredLesson =
      allLessons.find((lesson) => lesson.unlocked && !lesson.completed) || null;
    const initialLesson =
      nextRequiredLesson || localRememberedLesson || rememberedLesson || firstUnlockedLesson || null;
    setSelectedModuleId(initialModule.id);
    if (initialLesson) {
      setSelectedLessonId(initialLesson.id);
      const moduleOfLesson = modules.find((m) => m.lessons.some((l) => l.id === initialLesson.id));
      if (moduleOfLesson) setSelectedModuleId(moduleOfLesson.id);
    }
  }, [modules, allLessons, lastActiveLessonId, lessonStorageKey]);

  useEffect(() => {
    if (!selectedModule || !selectedLessonId) return;
    const inModule = selectedModule.lessons.some((l) => l.id === selectedLessonId);
    if (!inModule) {
      const fallback = selectedModule.lessons.find((l) => l.unlocked) || selectedModule.lessons[0];
      setSelectedLessonId(fallback?.id || '');
    }
  }, [selectedModule, selectedLessonId]);

  useEffect(() => {
    if (!selectedLessonId) return;
    try {
      localStorage.setItem(lessonStorageKey, selectedLessonId);
    } catch {
      // ignore storage errors
    }
  }, [selectedLessonId, lessonStorageKey]);

  useEffect(() => {
    if (!params.id || !selectedLessonId) return;
    const saveViewedLesson = async () => {
      try {
        await fetch(`/api/student/my-courses/${params.id}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: selectedLessonId, event: 'start' }),
        });
      } catch {
        // best-effort tracking; ignore
      }
    };
    saveViewedLesson();
  }, [params.id, selectedLessonId]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <style jsx global>{`
        @keyframes aivora-celebrate {
          0% { transform: scale(0.98); opacity: 0.9; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading course...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-4">
            <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg px-3 sm:px-4 py-2 overflow-visible">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:gap-4 min-h-[58px]">
              <div>
                <Link
                  href="/student/my-courses"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ArrowLeftIcon className="w-4 h-4" /> Back to My Courses
                </Link>
              </div>

              <div className="min-w-0 flex items-center justify-center overflow-x-auto overflow-y-visible py-2 lg:py-1">
              <div className="relative flex items-center gap-2 md:gap-2.5 px-2">
              {allLessons.slice(0, 14).map((lesson, idx) => {
                const done = lesson.completed;
                const active = lesson.id === selectedLessonId;
                return (
                  <button
                    key={`overview-dot-${lesson.id}`}
                    type="button"
                    onClick={() => lesson.unlocked && setSelectedLessonId(lesson.id)}
                    disabled={!lesson.unlocked}
                    className={`relative z-10 h-3 w-3 rounded-full shrink-0 transition-all duration-300 ${
                      active
                        ? 'scale-110 shadow-[0_0_14px_rgba(96,165,250,0.85)]'
                        : done
                        ? 'shadow-[0_0_8px_rgba(96,165,250,0.3)]'
                        : ''
                    } ${lesson.unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    title={`Lesson ${idx + 1}: ${lesson.title}`}
                  >
                    <span
                      className={`absolute inset-0 rounded-full ring-1 ${
                        active
                          ? 'ring-blue-300 bg-blue-100/90 dark:bg-blue-900/90'
                          : done
                          ? 'ring-blue-300/80 bg-blue-50/90 dark:bg-blue-900/70'
                          : 'ring-blue-300/60 bg-white/90 dark:bg-blue-950/60'
                      }`}
                    />
                    <span
                      className={`absolute inset-[1px] rounded-full ${
                        active
                          ? 'bg-blue-500'
                          : done
                          ? 'bg-blue-400/90'
                          : 'bg-blue-200/80 dark:bg-blue-800/80'
                      }`}
                    />
                    <span
                      className={`absolute inset-[3px] rounded-full ${
                        active ? 'bg-white/90' : 'bg-white/70 dark:bg-blue-100/60'
                      }`}
                    />
                  </button>
                );
              })}
              </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                <select
                  value={selectedModule?.id || ''}
                  onChange={(e) => {
                    const module = modules.find((m) => m.id === e.target.value);
                    if (!module) return;
                    setSelectedModuleId(module.id);
                    const firstUnlockedLesson = module.lessons.find((l) => l.unlocked) || module.lessons[0];
                    setSelectedLessonId(firstUnlockedLesson?.id || '');
                  }}
                  className="portal-surface w-56 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {modules.map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      {`CH${idx + 1}: ${m.title}`}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="portal-surface w-56 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {lessonsInSelectedModule.map((lesson, idx) => (
                    <option key={lesson.id} value={lesson.id} disabled={!lesson.unlocked}>
                      {`L${idx + 1}: ${lesson.title}${lesson.unlocked ? '' : ' (Locked)'}`}
                    </option>
                  ))}
                </select>

              </div>
            </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Browse lessons, track progress, and continue where you left off.
          </p>
          <div className="portal-surface mb-6 overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800">
            <div className="relative h-52 md:h-60">
              <img
                src="/code.jpg"
                alt="Course cover"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-blue-950/55" />
              <div className="absolute inset-0 p-5 pb-8 flex flex-col justify-end">
                <p className="text-3xl font-bold text-white drop-shadow mt-0">
                  {courseTitle || 'Start Your Learning Journey'}
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  Continue where you left off and complete each lesson with confidence.
                </p>
                {continueLesson && (
                  <div className="mt-16">
                    <Link
                      href={`/student/my-courses/${params.id}/player?lesson=${continueLesson.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                    >
                      <PlayCircleIcon className="w-4 h-4" />
                      Continue Learning
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            {(courseProgress >= 100 || courseStatus === 'completed') && (
              <div
                className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 shadow-sm"
                style={{ animation: 'aivora-celebrate 1.2s ease-out' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-5 h-5 text-white" />
                  <p className="text-sm font-semibold">Congratulations!</p>
                </div>
                <p className="text-lg font-bold">You completed this course.</p>
                <p className="text-sm text-blue-100 mt-1">
                  Pass the final quiz with at least 60% to unlock your Aivora certificate.
                </p>
              </div>
            )}
            {modules.map((module) => (
              <div
                key={module.id}
                className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
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
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        lesson.unlocked
                          ? 'border-blue-200 dark:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
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
          </div>
        </>
      )}
    </div>
  );
}



