'use client';

import { useEffect, useMemo, useState } from 'react';

type CourseItem = {
  id: string;
  title: string;
  progress: number;
  status?: string;
};

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

type CourseGrades = {
  course: CourseItem;
  chapterAttempts: ChapterAttempt[];
  finalAttempts: FinalAttempt[];
  error?: string;
};

function formatAttemptDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function AttemptRow({
  label,
  score,
  correctAnswers,
  totalQuestions,
  submittedAt,
}: {
  label?: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  submittedAt: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {label ? <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{label}</p> : null}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {correctAnswers}/{totalQuestions} correct
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{score.toFixed(2)}%</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatAttemptDate(submittedAt)}</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentQuizGradesIndexPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [grades, setGrades] = useState<CourseGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllGrades = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/student/my-courses', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load courses');

        const courseList = Array.isArray(data.courses) ? (data.courses as CourseItem[]) : [];
        setCourses(courseList);

        const courseGrades = await Promise.all(
          courseList.map(async (course) => {
            try {
              const gradesRes = await fetch(`/api/student/my-courses/${course.id}/quiz-grades`, { cache: 'no-store' });
              const gradesData = await gradesRes.json();
              if (!gradesRes.ok) {
                return {
                  course,
                  chapterAttempts: [],
                  finalAttempts: [],
                  error: gradesData?.message || 'Failed to load grades',
                };
              }

              return {
                course,
                chapterAttempts: Array.isArray(gradesData?.chapterAttempts) ? gradesData.chapterAttempts : [],
                finalAttempts: Array.isArray(gradesData?.finalAttempts) ? gradesData.finalAttempts : [],
              };
            } catch (courseErr: unknown) {
              return {
                course,
                chapterAttempts: [],
                finalAttempts: [],
                error: courseErr instanceof Error ? courseErr.message : 'Failed to load grades',
              };
            }
          })
        );

        setGrades(courseGrades);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadAllGrades();
  }, []);

  const totals = useMemo(() => {
    const chapter = grades.reduce((sum, item) => sum + item.chapterAttempts.length, 0);
    const final = grades.reduce((sum, item) => sum + item.finalAttempts.length, 0);
    return {
      chapter,
      final,
      coursesWithAttempts: grades.filter((item) => item.chapterAttempts.length > 0 || item.finalAttempts.length > 0).length,
    };
  }, [grades]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Quiz Grades</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          All chapter and final quiz attempts across your enrolled courses.
        </p>
      </div>

      {!loading && !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="portal-surface rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Courses with attempts</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{totals.coursesWithAttempts}</p>
          </div>
          <div className="portal-surface rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Chapter attempts</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{totals.chapter}</p>
          </div>
          <div className="portal-surface rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Final attempts</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{totals.final}</p>
          </div>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading grades...</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {!loading && !error && courses.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No enrolled courses found.</p>
      ) : null}

      {!loading && !error && grades.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {grades.map((item) => (
            <div
              key={item.course.id}
              className="portal-surface rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">{item.course.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Progress: {Number(item.course.progress || 0)}%</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 text-xs font-medium">
                  Quiz results
                </span>
              </div>

              {item.error ? (
                <p className="text-sm text-red-500 mb-4">{item.error}</p>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Chapter Quiz Attempts</h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {item.chapterAttempts.length} attempt{item.chapterAttempts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {item.chapterAttempts.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No chapter attempts yet.</p>
                    ) : (
                      item.chapterAttempts.map((attempt) => (
                        <AttemptRow
                          key={attempt.id}
                          label={attempt.moduleTitle}
                          score={Number(attempt.scorePercentage || 0)}
                          correctAnswers={Number(attempt.correctAnswers || 0)}
                          totalQuestions={Number(attempt.totalQuestions || 0)}
                          submittedAt={attempt.submittedAt}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Final Course Quiz Attempts</h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {item.finalAttempts.length} attempt{item.finalAttempts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {item.finalAttempts.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No final quiz attempts yet.</p>
                    ) : (
                      item.finalAttempts.map((attempt) => (
                        <AttemptRow
                          key={attempt.id}
                          score={Number(attempt.scorePercentage || 0)}
                          correctAnswers={Number(attempt.correctAnswers || 0)}
                          totalQuestions={Number(attempt.totalQuestions || 0)}
                          submittedAt={attempt.submittedAt}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
