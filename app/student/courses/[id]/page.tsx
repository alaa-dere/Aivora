'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  PlayCircleIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type PaymentMethod = 'card' | 'paypal';

type CourseData = {
  id: string;
  title: string;
  teacherName: string;
  price: number;
  description: string;
  durationWeeks: number;
  imageUrl?: string | null;
  enrolled: boolean;
};

export default function CourseDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paymentForm, setPaymentForm] = useState({
    fullName: '',
    email: '',
    country: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    paypalEmail: '',
    paypalTxnId: '',
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadCourse();
  }, [params.id]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile/me', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;
        setPaymentForm((prev) => ({
          ...prev,
          fullName: prev.fullName || String(data?.user?.fullName || ''),
          email: prev.email || String(data?.user?.email || ''),
        }));
      } catch {
        // keep form empty if profile is unavailable
      }
    };

    loadProfile();
  }, []);

  const handleEnroll = async () => {
    if (!course) return;
    if (!paymentForm.fullName.trim() || !paymentForm.email.trim() || !paymentForm.country.trim()) {
      setError('Please fill full name, email, and country.');
      return;
    }
    if (method === 'card' && !paymentForm.cardNumber.replace(/\D/g, '').slice(-4)) {
      setError('Please enter valid card details.');
      return;
    }
    if (method === 'paypal' && (!paymentForm.paypalEmail.trim() || !paymentForm.paypalTxnId.trim())) {
      setError('Please enter PayPal details.');
      return;
    }

    setPaying(true);
    setError(null);
    try {
      const cardLast4 = paymentForm.cardNumber.replace(/\D/g, '').slice(-4) || null;
      const res = await fetch(`/api/student/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentConfirmed: true,
          method,
          fullName: paymentForm.fullName.trim(),
          email: paymentForm.email.trim(),
          country: paymentForm.country.trim(),
          cardLast4: method === 'card' ? cardLast4 : null,
          paypalEmail: method === 'paypal' ? paymentForm.paypalEmail.trim() : null,
          paypalTxnId: method === 'paypal' ? paymentForm.paypalTxnId.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Payment failed');
      }
      router.push(`/student/my-courses/${course.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 text-gray-700 dark:text-gray-200">
        Loading course...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 text-gray-700 dark:text-gray-200">
        {error || 'Course not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 transition-colors duration-300">
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
        <div className="relative overflow-hidden rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-950 mb-6">
          <img
            src={course.imageUrl || '/default-course.jpg'}
            alt={course.title}
            className="h-48 w-full object-cover opacity-85"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/50 to-transparent" />
          <div className="absolute left-5 bottom-5">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{course.title}</h1>
            <p className="text-sm text-blue-100 mt-1">By {course.teacherName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                ${course.price}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                {course.durationWeeks} weeks
              </span>
              {course.enrolled && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                  Enrolled
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Course overview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {course.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {course.enrolled ? (
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 p-5">
                <p className="text-sm text-emerald-700 dark:text-emerald-200 font-medium mb-3">
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
              <div className="rounded-xl border border-blue-100 dark:border-blue-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Payment Information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={paymentForm.fullName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, fullName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                  />
                  <input
                    value={paymentForm.email}
                    onChange={(e) => setPaymentForm({ ...paymentForm, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                  />
                  <input
                    value={paymentForm.country}
                    onChange={(e) => setPaymentForm({ ...paymentForm, country: e.target.value })}
                    placeholder="Country"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white md:col-span-2"
                    required
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                      method === 'card'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-blue-200 dark:border-blue-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <CreditCardIcon className="w-4 h-4" /> Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('paypal')}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                      method === 'paypal'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-blue-200 dark:border-blue-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <CheckCircleIcon className="w-4 h-4" /> PayPal
                  </button>
                </div>

                {method === 'card' && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                      placeholder="Card number"
                      className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white md:col-span-2"
                      required={method === 'card'}
                    />
                    <input
                      value={paymentForm.expiry}
                      onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
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
                )}

                {method === 'paypal' && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={paymentForm.paypalEmail}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paypalEmail: e.target.value })}
                      placeholder="PayPal email"
                      type="email"
                      className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      required={method === 'paypal'}
                    />
                    <input
                      value={paymentForm.paypalTxnId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paypalTxnId: e.target.value })}
                      placeholder="PayPal transaction ID"
                      className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      required={method === 'paypal'}
                    />
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <LockClosedIcon className="w-4 h-4" />
                  Payment details are handled securely.
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
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      </div>
    </div>
  );
}
