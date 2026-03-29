'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type AnswerRow = {
  id: string;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

const mockResults: Record<string, { title: string; score: number; dateLabel: string; answers: AnswerRow[] }> = {
  q1: {
    title: 'Quiz 1 — Basics',
    score: 85,
    dateLabel: '2 days ago',
    answers: [
      {
        id: 'a1',
        question: 'What is JSX?',
        yourAnswer: 'A syntax extension for JavaScript used with React',
        correctAnswer: 'A syntax extension for JavaScript used with React',
        isCorrect: true,
      },
      {
        id: 'a2',
        question: 'Props are…',
        yourAnswer: 'Mutable state inside a component',
        correctAnswer: 'Inputs to a component (read-only)',
        isCorrect: false,
      },
      {
        id: 'a3',
        question: 'useState returns…',
        yourAnswer: 'State value and a setter function',
        correctAnswer: 'State value and a setter function',
        isCorrect: true,
      },
    ],
  },
  q3: {
    title: 'Quiz 3 — Components',
    score: 78,
    dateLabel: '1 week ago',
    answers: [
      {
        id: 'a1',
        question: 'A React component must…',
        yourAnswer: 'Return a valid React element',
        correctAnswer: 'Return a valid React element',
        isCorrect: true,
      },
      {
        id: 'a2',
        question: 'Keys in lists are used to…',
        yourAnswer: 'Style list items',
        correctAnswer: 'Help React identify changed items efficiently',
        isCorrect: false,
      },
    ],
  },
};

export default function QuizResultPage() {
  const params = useParams<{ id: string; quizId: string }>();
  const courseId = params.id;
  const quizId = params.quizId;
  const [playerHref, setPlayerHref] = useState(`/student/my-courses/${courseId}/player`);

  const result = useMemo(() => mockResults[quizId], [quizId]);

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

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-200">
        Result not found.
      </div>
    );
  }

  const correctCount = result.answers.filter((a) => a.isCorrect).length;
  const total = result.answers.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
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
          {result.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {result.dateLabel} • {correctCount}/{total} correct
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{result.score}%</p>
            </div>
          </div>

          <button
            onClick={() => alert('Demo: retake quiz flow here')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Retake quiz
          </button>
        </div>
      </div>

      {/* Answers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Answers</h2>

        <div className="space-y-3">
          {result.answers.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-xl border border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-gray-800 dark:text-white">{a.question}</p>

                {a.isCorrect ? (
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
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{a.yourAnswer}</p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Correct answer</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{a.correctAnswer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-5">
          (Demo) Later we will load real answers from the backend.
        </p>
      </div>
    </div>
  );
}
