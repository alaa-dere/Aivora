'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, CreditCardIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

export default function CourseDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardName: '',
    exp: '',
    cvc: '',
  });

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/courses/${params.id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load course');
        }
        setCourse(data.course);
      } catch (err: any) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadCourse();
  }, [params.id]);

  const handleEnroll = async () => {
    if (!course) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentConfirmed: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Payment failed');
      }
      router.push(`/student/my-courses/${course.id}`);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-200">
        Loading course...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-200">
        {error || 'Course not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>

        <Link
          href="/student/my-courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <PlayCircleIcon className="w-5 h-5" /> My Courses
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{course.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Teacher: <span className="text-gray-700 dark:text-gray-200">{course.teacherName}</span>
            </p>
          </div>

          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            ${course.price}
          </span>
        </div>

        <p className="mt-4 text-gray-600 dark:text-gray-300 whitespace-pre-line">{course.description}</p>

        {course.enrolled ? (
          <div className="mt-6 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
            <p className="text-sm text-emerald-700 dark:text-emerald-200 font-medium mb-2">
              You are enrolled in this course.
            </p>
            <button
              onClick={() => router.push(`/student/my-courses/${course.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Go to Course
            </button>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">
              Payment Information (Placeholder)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={paymentForm.cardNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                placeholder="Card number"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
              <input
                value={paymentForm.cardName}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                placeholder="Name on card"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
              <input
                value={paymentForm.exp}
                onChange={(e) => setPaymentForm({ ...paymentForm, exp: e.target.value })}
                placeholder="MM/YY"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
              <input
                value={paymentForm.cvc}
                onChange={(e) => setPaymentForm({ ...paymentForm, cvc: e.target.value })}
                placeholder="CVC"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="accent-blue-600"
              />
              I confirm I want to enroll and proceed to payment.
            </label>

            <button
              onClick={handleEnroll}
              disabled={!agree || paying}
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                agree && !paying
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CreditCardIcon className="w-5 h-5" />
              {paying ? 'Processing...' : 'Enroll & Pay'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
