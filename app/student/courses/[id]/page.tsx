'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeftIcon, CreditCardIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

const mockCourses = [
  { id: 'c1', title: 'React Basics', price: 25, teacher: 'Alaa', desc: 'React foundations, hooks, components.' },
  { id: 'c2', title: 'JavaScript Essentials', price: 20, teacher: 'Batool', desc: 'JS core, DOM, async & patterns.' },
  { id: 'c3', title: 'CSS & Layout Mastery', price: 18, teacher: 'Sara', desc: 'Flexbox, grid, responsive design.' },
];

export default function CourseDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [agree, setAgree] = useState(false);

  const course = useMemo(() => mockCourses.find((c) => c.id === params.id), [params.id]);

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-200">
        Course not found.
      </div>
    );
  }

  const handleEnroll = () => {
    // عادة: تروح لصفحة الدفع/الخصم
    router.push('/student/wallet');
  };

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
              Teacher: <span className="text-gray-700 dark:text-gray-200">{course.teacher}</span>
            </p>
          </div>

          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            ${course.price}
          </span>
        </div>

        <p className="mt-4 text-gray-600 dark:text-gray-300">{course.desc}</p>

        <div className="mt-6 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">
            Enrollment
          </p>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
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
            disabled={!agree}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              agree
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CreditCardIcon className="w-5 h-5" />
            Enroll & Pay
          </button>
        </div>
      </div>
    </div>
  );
}