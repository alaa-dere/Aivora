'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type QuizQuestion = {
  id: string;
  order: number;
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  options: string[];
};

type QuizAttempt = {
  id: string;
  scorePercentage: number;
  submittedAt: string;
};

export default function StudentPathQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathTitle, setPathTitle] = useState('Path');
  const [canStart, setCanStart] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [passingScorePercentage, setPassingScorePercentage] = useState(60);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionIndex?: number; textAnswer?: string }>
  >({});
  const [result, setResult] = useState<null | { scorePercentage: number; passed: boolean; certificateId: string | null }>(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/student/paths/${params.id}/quiz`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load path quiz');
      setPathTitle(String(data?.path?.title || 'Path'));
      setCanStart(Boolean(data?.canStart));
      setQuestionCount(Number(data?.questionCount || 0));
      setPassingScorePercentage(Number(data?.passingScorePercentage || 60));
      setCertificateId(data?.certificateId ? String(data.certificateId) : null);
      setAttempts(Array.isArray(data?.attempts) ? data.attempts : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load path quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) loadOverview();
  }, [params.id]);

  const startQuiz = async () => {
    try {
      setStarting(true);
      setError(null);
      const res = await fetch(`/api/student/paths/${params.id}/quiz?mode=start`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to start quiz');
      setQuestions(Array.isArray(data?.questions) ? data.questions : []);
      setAnswers({});
      setResult(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setStarting(false);
    }
  };

  const allAnswered = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => {
      const answer = answers[q.id];
      if (!answer) return false;
      if (q.questionType === 'written') return Boolean(String(answer.textAnswer || '').trim());
      return Number.isInteger(answer.selectedOptionIndex);
    });
  }, [questions, answers]);

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex:
          q.questionType === 'written'
            ? null
            : Number.isInteger(answers[q.id]?.selectedOptionIndex)
              ? Number(answers[q.id]?.selectedOptionIndex)
              : null,
        textAnswer: q.questionType === 'written' ? String(answers[q.id]?.textAnswer || '') : '',
      }));

      const res = await fetch(`/api/student/paths/${params.id}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to submit quiz');

      setResult({
        scorePercentage: Number(data?.scorePercentage || 0),
        passed: Boolean(data?.passed),
        certificateId: data?.certificateId ? String(data.certificateId) : null,
      });
      setQuestions([]);
      await loadOverview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="mb-5">
        <Link
          href={`/student/paths/${params.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Path
        </Link>
      </div>

      <div className="portal-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 p-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Path Final Quiz</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pathTitle}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
          Final quiz has 15 random questions from this path courses' question banks.
          Passing score is {passingScorePercentage}%.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading quiz...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          {certificateId && (
            <div className="portal-surface rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 mb-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                You already passed this path final quiz and earned your path certificate.
              </p>
            </div>
          )}

          {result && (
            <div className={`portal-surface rounded-xl border p-4 mb-4 ${
              result.passed
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20'
            }`}>
              <p className={`text-sm font-semibold ${result.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                Score: {result.scorePercentage.toFixed(2)}% {result.passed ? '(Passed)' : '(Failed)'}
              </p>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="portal-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 p-5">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {canStart
                  ? 'You can start the final path quiz now.'
                  : `Quiz is not available yet. Available bank questions: ${questionCount}/15.`}
              </p>
              <button
                onClick={startQuiz}
                disabled={!canStart || starting}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  canStart
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {starting ? 'Preparing quiz...' : 'Start Path Final Quiz'}
              </button>

              {attempts.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Previous attempts</p>
                  <div className="space-y-2">
                    {attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 p-3 text-sm text-gray-700 dark:text-gray-200"
                      >
                        {Number(attempt.scorePercentage || 0).toFixed(2)}% - {new Date(attempt.submittedAt).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="portal-surface rounded-xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 p-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                    Q{q.order}. {q.questionText}
                  </p>
                  {q.questionType === 'written' ? (
                    <input
                      value={answers[q.id]?.textAnswer || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: { ...prev[q.id], textAnswer: e.target.value },
                        }))
                      }
                      placeholder="Type your answer..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 py-2 text-sm text-gray-800 dark:text-white"
                    />
                  ) : (
                    <div className="space-y-2">
                      {q.options.map((opt, idx) => (
                        <label
                          key={`${q.id}-${idx}`}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 px-3 py-2 text-sm"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id]?.selectedOptionIndex === idx}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], selectedOptionIndex: idx },
                              }))
                            }
                          />
                          <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-3">
                <button
                  onClick={submitQuiz}
                  disabled={!allAnswered || submitting}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    allAnswered ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Path Quiz'}
                </button>
                <button
                  onClick={() => {
                    setQuestions([]);
                    setAnswers({});
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

