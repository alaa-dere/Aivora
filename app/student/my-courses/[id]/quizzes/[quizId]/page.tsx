'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

type AnswerRow = {
  id: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type AttemptData = {
  id: string;
  courseId: string;
  courseTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  submittedAt: string;
  certificateId?: string | null;
};

const PASSING_SCORE_PERCENTAGE = 60;

export default function QuizResultPage() {
  const params = useParams<{ id: string; quizId: string }>();
  const courseId = params.id;
  const attemptId = params.quizId;

  const [playerHref, setPlayerHref] = useState(`/student/my-courses/${courseId}/player`);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvaluationPrompt, setShowEvaluationPrompt] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/student/my-courses/${courseId}/quiz-attempts/${attemptId}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load quiz result');
        }

        setAttempt(data.attempt || null);
        setAnswers(data.answers || []);

        const attemptData = data.attempt || null;
        if (
          attemptData &&
          Number(attemptData.scorePercentage || 0) >= PASSING_SCORE_PERCENTAGE &&
          attemptData.certificateId
        ) {
          try {
            const evalRes = await fetch(`/api/student/my-courses/${courseId}/evaluation`, {
              cache: 'no-store',
            });
            const evalData = await evalRes.json();
            if (evalRes.ok && evalData.canEvaluate && !evalData.hasResponse) {
              setShowEvaluationPrompt(true);
            }
          } catch {
            // non-blocking prompt load
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz result');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [courseId, attemptId]);

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

  const handleSkipEvaluation = async () => {
    try {
      setSavingEvaluation(true);
      setEvaluationError(null);
      const res = await fetch(`/api/student/my-courses/${courseId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to skip evaluation');
      }
      setShowEvaluationPrompt(false);
    } catch (err: unknown) {
      setEvaluationError(err instanceof Error ? err.message : 'Failed to skip evaluation');
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!rating) {
      setEvaluationError('Please choose a star rating first.');
      return;
    }
    try {
      setSavingEvaluation(true);
      setEvaluationError(null);
      const res = await fetch(`/api/student/my-courses/${courseId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', rating, feedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save evaluation');
      }
      setShowEvaluationPrompt(false);
    } catch (err: unknown) {
      setEvaluationError(err instanceof Error ? err.message : 'Failed to save evaluation');
    } finally {
      setSavingEvaluation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 text-gray-700 dark:text-gray-200">
        Loading result...
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 text-red-600 dark:text-red-400">
        {error || 'Result not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/student/my-courses/${courseId}/quizzes`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to quizzes
        </Link>

        <Link
          href={playerHref}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to player
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Course Quiz Result
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {attempt.correctAnswers}/{attempt.totalQuestions} correct
        </p>
      </div>

      {attempt.scorePercentage >= PASSING_SCORE_PERCENTAGE && (
        <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5" />
            <p className="text-sm font-semibold">Congratulations!</p>
          </div>
          <p className="text-lg font-bold">You passed the quiz.</p>
          <p className="text-sm text-emerald-100 mt-1">
            Great work. You can now view your course certificate.
          </p>
          {attempt.certificateId && (
            <div className="mt-4">
              <Link
                href={`/student/certificates/${attempt.certificateId}`}
                className="portal-surface inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
              >
                View Certificate
              </Link>
            </div>
          )}
        </div>
      )}

      {showEvaluationPrompt && (
        <div className="portal-surface mb-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Rate This Course</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You unlocked your certificate. Would you like to rate this course and share feedback?
          </p>

          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, idx) => {
              const value = idx + 1;
              return (
                <button
                  key={`eval-star-${value}`}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-md p-1 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <StarIcon
                    className={`w-7 h-7 ${value <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="Optional feedback..."
            className="portal-surface mt-4 w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-3 text-sm"
          />

          {evaluationError && (
            <p className="mt-2 text-sm text-red-500">{evaluationError}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmitEvaluation}
              disabled={savingEvaluation}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60"
            >
              {savingEvaluation ? 'Saving...' : 'Submit Evaluation'}
            </button>
            <button
              type="button"
              onClick={handleSkipEvaluation}
              disabled={savingEvaluation}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 disabled:opacity-60"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {Math.round(attempt.scorePercentage)}%
              </p>
            </div>
          </div>

          <Link
            href={`/student/my-courses/${courseId}/quizzes`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>

      <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Answers</h2>

        <div className="space-y-3">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className="p-4 rounded-xl border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-gray-800 dark:text-white whitespace-pre-wrap">{answer.questionText}</p>

                {answer.isCorrect ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    <CheckCircleIcon className="w-4 h-4" /> Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    <XCircleIcon className="w-4 h-4" /> Wrong
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your answer</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">
                    {answer.selectedAnswer || 'No answer'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Correct answer</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{answer.correctAnswer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
