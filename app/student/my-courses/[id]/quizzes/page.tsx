'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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

type ReviewAnswer = {
  id: string;
  order: number;
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type QuizOverview = {
  course?: { id: string; title: string };
  lesson?: { id: string; title: string };
  completed?: boolean;
  questionCount: number;
  canStart: boolean;
  attempts?: Array<{
    id: string;
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
    submittedAt: string;
  }>;
};

const CHAPTER_QUIZ_QUESTION_COUNT = 5;
const COURSE_QUIZ_QUESTION_COUNT = 10;

function CourseQuizzesPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const moduleId = String(searchParams.get('moduleId') || '').trim();
  const isChapterQuiz = !!moduleId;

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
  const [latestResult, setLatestResult] = useState<null | {
    scorePercentage: number;
    correctAnswers: number;
    totalQuestions: number;
  }>(null);
  const [latestReviewAnswers, setLatestReviewAnswers] = useState<ReviewAnswer[]>([]);

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
      const endpoint = isChapterQuiz
        ? `/api/student/my-courses/${courseId}/lesson-quiz?moduleId=${encodeURIComponent(moduleId)}`
        : `/api/student/my-courses/${courseId}/quiz`;
      const res = await fetch(endpoint, {
        cache: 'no-store',
        credentials: 'include',
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
  }, [courseId, isChapterQuiz, moduleId]);

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

      const endpoint = isChapterQuiz
        ? `/api/student/my-courses/${courseId}/lesson-quiz?mode=start&moduleId=${encodeURIComponent(moduleId)}`
        : `/api/student/my-courses/${courseId}/quiz?mode=start`;
      const res = await fetch(endpoint, {
        cache: 'no-store',
        credentials: 'include',
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
      setLatestResult(null);
      setLatestReviewAnswers([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setStarting(false);
    }
  };

  const submitQuiz = async () => {
    const minimumQuestions = isChapterQuiz ? CHAPTER_QUIZ_QUESTION_COUNT : COURSE_QUIZ_QUESTION_COUNT;
    if (activeQuestions.length < minimumQuestions) {
      setError('Quiz session is invalid. Please restart the quiz.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: {
        lessonId?: string;
        moduleId?: string;
        answers: Array<{
          questionId: string;
          selectedOptionIndex: number | null;
          textAnswer: string;
          selectedTextAnswer: string;
        }>;
      } = {
        answers: activeQuestions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id] ?? null,
          textAnswer: textAnswers[question.id] || '',
          selectedTextAnswer: textAnswers[question.id] || '',
        })),
      };
      if (isChapterQuiz) {
        payload.moduleId = moduleId;
      }

      const endpoint = isChapterQuiz
        ? `/api/student/my-courses/${courseId}/lesson-quiz`
        : `/api/student/my-courses/${courseId}/quiz`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit quiz');
      }

      if (isChapterQuiz) {
        setLatestResult({
          scorePercentage: Number(data.scorePercentage || 0),
          correctAnswers: Number(data.correctAnswers || 0),
          totalQuestions: Number(data.totalQuestions || 0),
        });
        setLatestReviewAnswers(
          Array.isArray(data.reviewAnswers)
            ? data.reviewAnswers.map((item: unknown) => {
                const typed = (item || {}) as Partial<ReviewAnswer>;
                return {
                  id: String(typed.id || ''),
                  order: Number(typed.order || 0),
                  questionType: typed.questionType || 'multiple_choice',
                  questionText: String(typed.questionText || ''),
                  options: Array.isArray(typed.options) ? typed.options.map((option) => String(option || '')) : [],
                  selectedOptionIndex:
                    typed.selectedOptionIndex === null || typed.selectedOptionIndex === undefined
                      ? null
                      : Number(typed.selectedOptionIndex),
                  correctOptionIndex: Number(typed.correctOptionIndex || 0),
                  selectedAnswer: String(typed.selectedAnswer || ''),
                  correctAnswer: String(typed.correctAnswer || ''),
                  isCorrect: Boolean(typed.isCorrect),
                };
              })
            : []
        );
        setActiveQuestions([]);
        await loadOverview();
      } else {
        router.push(`/student/my-courses/${courseId}/quizzes/${data.attemptId}`);
      }
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
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
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
          {isChapterQuiz ? 'Chapter Quiz' : 'Course Quiz'}
          {overview?.lesson?.title
            ? ` - ${overview.lesson.title}`
            : overview?.course?.title
              ? ` - ${overview.course.title}`
              : ''}
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
            <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
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
              <Link
                href={`/student/my-courses/${courseId}/grades`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                View All Grades
              </Link>
            </div>

            {!isChapterQuiz && !overview?.completed && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                Finish the full course first to unlock this quiz.
              </p>
            )}
            {(overview?.questionCount || 0) <
              (isChapterQuiz ? CHAPTER_QUIZ_QUESTION_COUNT : COURSE_QUIZ_QUESTION_COUNT) && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {isChapterQuiz
                  ? `This chapter quiz unlocks once your teacher adds at least ${CHAPTER_QUIZ_QUESTION_COUNT} questions for this chapter.`
                  : `This quiz unlocks once your teacher adds at least ${COURSE_QUIZ_QUESTION_COUNT} bank questions.`}
              </p>
            )}
            {isChapterQuiz && overview?.attempts?.[0] && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Latest chapter score: {overview.attempts[0].scorePercentage.toFixed(2)}%
              </p>
            )}
            {latestResult && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                Result: {latestResult.scorePercentage.toFixed(2)}% ({latestResult.correctAnswers}/{latestResult.totalQuestions})
              </div>
            )}
            {isChapterQuiz && latestReviewAnswers.length > 0 && (
              <div className="mt-4 space-y-3">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white">Your Answers</h2>
                {latestReviewAnswers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`rounded-lg border p-3 ${
                      answer.isCorrect
                        ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
                        : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {answer.order}. {answer.questionText}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          answer.isCorrect
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'
                        }`}
                      >
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-gray-700 dark:text-gray-300">
                      <p>
                        <span className="font-semibold">Your answer:</span>{' '}
                        {answer.selectedAnswer || 'No answer selected'}
                      </p>
                      {!answer.isCorrect && (
                        <p>
                          <span className="font-semibold">Correct answer:</span> {answer.correctAnswer || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {activeQuestions.length > 0 && (
            <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
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
                          className="portal-surface w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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

export default function CourseQuizzesPage() {
  return (
    <Suspense fallback={null}>
      <CourseQuizzesPageContent />
    </Suspense>
  );
}
