'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type Course = {
  id: string;
  title: string;
  teacher: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: number;
  hours: number;
  description: string;
};

const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'React Basics',
    teacher: 'Alaa',
    price: 25,
    level: 'Beginner',
    lessons: 18,
    hours: 6,
    description: 'Build components, state, props, and hooks foundations.',
  },
  {
    id: 'c2',
    title: 'JavaScript Essentials',
    teacher: 'Batool',
    price: 20,
    level: 'Beginner',
    lessons: 22,
    hours: 7,
    description: 'Core JS, async, DOM, and best practices.',
  },
  {
    id: 'c3',
    title: 'CSS & Layout Mastery',
    teacher: 'Sara',
    price: 18,
    level: 'Intermediate',
    lessons: 16,
    hours: 5,
    description: 'Flexbox, Grid, responsive UI, and modern layouts.',
  },
];

export default function StudentCoursesPage() {
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<'All' | Course['level']>('All');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return mockCourses.filter((c) => {
      const matchQ =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.teacher.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query);
      const matchLevel = level === 'All' ? true : c.level === level;
      return matchQ && matchLevel;
    });
  }, [q, level]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Course Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Explore courses and enroll from the details page.
        </p>
      </div>

      {/* Search / Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, teacher, keyword..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none"
            >
              <option value="All">All levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {c.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Teacher: <span className="text-gray-700 dark:text-gray-200">{c.teacher}</span>
                </p>
              </div>

              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                ${c.price}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{c.description}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                {c.level}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                {c.lessons} lessons
              </span>
              <span className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                {c.hours} hours
              </span>
            </div>

            <div className="mt-5">
              <Link
                href={`/student/courses/${c.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open details <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No courses match your search.
        </div>
      )}
    </div>
  );
}