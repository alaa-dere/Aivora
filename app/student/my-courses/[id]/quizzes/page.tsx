'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type QuestionItem = {
  id: string;
  order: number;
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  options: string[];
};

type QuizOverview = {
  course: { id: string; title: string };
  completed: boolean;
  questionCount: number;
  canStart: boolean;
};

export default function CourseQuizzesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const [playerHref, setPlayerHref] = useState(`/student/my-courses/${courseId}/player`);
  const [overview, setOverview] = useState<QuizOverview | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const readJsonResponse = async (res: Response) => {
    const raw = await res.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      if (!res.ok) {
        throw new Error(`Request failed (${res.status}). The server returned a non-JSON response.`);
      }
      throw new Error('Server returned an invalid response format.');
    }
  };

  const currentQuestion =
    activeQuestions.length > 0 ? activeQuestions[currentQuestionIndex] || null : null;
  const isLastQuestion =
    activeQuestions.length > 0 && currentQuestionIndex === activeQuestions.length - 1;
  const currentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.questionType === 'written') {
      return Boolean((textAnswers[currentQuestion.id] || '').trim());
    }
    const value = answers[currentQuestion.id];
    return value !== null && value !== undefined;
  }, [answers, currentQuestion, textAnswers]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/my-courses/${courseId}/quiz`, {
        cache: 'no-store',
      });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load course quiz');
      }
      setOverview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load course quiz');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

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

  const startQuiz = async () => {
    try {
      setError(null);
      setStarting(true);

      const res = await fetch(`/api/student/my-courses/${courseId}/quiz?mode=start`, {
        cache: 'no-store',
      });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start quiz');
      }

      const questions: QuestionItem[] = data.questions || [];
      const initialAnswers: Record<string, number | null> = {};
      const initialTextAnswers: Record<string, string> = {};
      for (const question of questions) {
        initialAnswers[question.id] = null;
        initialTextAnswers[question.id] = '';
      }

      setActiveQuestions(questions);
      setAnswers(initialAnswers);
      setTextAnswers(initialTextAnswers);
      setCurrentQuestionIndex(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setStarting(false);
    }
  };

  const submitQuiz = async () => {
    if (activeQuestions.length !== 10) {
      setError('Quiz session is invalid. Please restart the quiz.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        answers: activeQuestions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id] ?? null,
          textAnswer: textAnswers[question.id] || '',
        })),
      };

      const res = await fetch(`/api/student/my-courses/${courseId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit quiz');
      }

      router.push(`/student/my-courses/${courseId}/quizzes/${data.attemptId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const goNextQuestion = () => {
    if (!currentQuestionAnswered) {
      setError('Please answer this question before continuing.');
      return;
    }
    setError(null);
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, activeQuestions.length - 1));
  };

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
          Course Quiz
          {overview?.course?.title ? ` - ${overview.course.title}` : ''}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Answer each question in order.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading quiz details...</p>
      ) : (
        <div className="space-y-6">
          {activeQuestions.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={startQuiz}
                disabled={!overview?.canStart || starting || activeQuestions.length > 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {starting ? 'Preparing quiz...' : 'Start Random Quiz'}
                <ArrowRightIcon className="w-4 h-4" />
              </button>

              <Link
                href={playerHref}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                Back to player
              </Link>
            </div>

            {!overview?.completed && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                Finish the full course first to unlock this quiz.
              </p>
            )}
            {(overview?.questionCount || 0) < 10 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                This quiz unlocks once your teacher adds at least 10 bank questions.
              </p>
            )}
            </div>
          )}

          {activeQuestions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
              {currentQuestion && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Active Quiz</h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Question {currentQuestionIndex + 1} / {activeQuestions.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="font-medium text-gray-800 dark:text-white whitespace-pre-wrap">
                      {currentQuestion.order}. {currentQuestion.questionText}
                    </p>

                    <div className="mt-3 space-y-2">
                      {currentQuestion.questionType === 'written' ? (
                        <textarea
                          value={textAnswers[currentQuestion.id] || ''}
                          onChange={(e) =>
                            setTextAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: e.target.value,
                            }))
                          }
                          placeholder="Write your answer"
                          rows={4}
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      ) : (
                        currentQuestion.options.map((option, optionIndex) => (
                          <label
                            key={`${currentQuestion.id}-${optionIndex}`}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              checked={answers[currentQuestion.id] === optionIndex}
                              onChange={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [currentQuestion.id]: optionIndex,
                                }))
                              }
                              className="w-4 h-4"
                            />
                            <span className="whitespace-pre-wrap">{option}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    {isLastQuestion ? (
                      <button
                        onClick={submitQuiz}
                        disabled={submitting || !currentQuestionAnswered}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium transition-colors"
                      >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                      </button>
                    ) : (
                      <button
                        onClick={goNextQuestion}
                        disabled={!currentQuestionAnswered}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium transition-colors"
                      >
                        Next Question <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
    </div>
  );
}
