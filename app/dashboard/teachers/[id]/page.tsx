'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  AcademicCapIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function TeacherProfilePage() {
  const params = useParams();
  const teacherId = params.id as string;

  const [tab, setTab] = useState<'overview' | 'courses' | 'students' | 'earnings'>('overview');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800 p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Teacher Profile
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          ID: <span className="font-mono">{teacherId}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'courses', label: 'Courses' },
          { key: 'students', label: 'Students' },
          { key: 'earnings', label: 'Earnings' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-blue-950 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 shadow-sm">

        {tab === 'overview' && (
          <div className="grid sm:grid-cols-3 gap-6">
            <Card title="Total Courses" value="5" icon={AcademicCapIcon} />
            <Card title="Total Students" value="87" icon={UsersIcon} />
            <Card title="Monthly Revenue" value="$1,240" icon={CurrencyDollarIcon} />
          </div>
        )}

        {tab === 'courses' && (
          <p className="text-gray-600 dark:text-gray-300">
            Teacher courses list will appear here.
          </p>
        )}

        {tab === 'students' && (
          <p className="text-gray-600 dark:text-gray-300">
            Enrolled students list will appear here.
          </p>
        )}

        {tab === 'earnings' && (
          <p className="text-gray-600 dark:text-gray-300">
            Earnings analytics will appear here.
          </p>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all">
      <div className="flex justify-between mb-2">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}