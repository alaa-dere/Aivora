'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  UsersIcon,
  Squares2X2Icon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type CourseStatus = 'draft' | 'published' | 'archived';

type Course = {
  id: string;
  title: string;
  description?: string;
  teacherName: string;
  teacherId: string;
  price: number;
  teacherSharePct: number;
  students: number;
  status: CourseStatus;
  createdAt: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all');

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers/list');
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.status === 'published').length;
    const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0);
    const revenueMonthlyMock = courses
      .filter((c) => c.status === 'published')
      .reduce((acc, c) => acc + (c.students || 0) * c.price, 0);

    return { total, active, totalStudents, revenueMonthlyMock };
  }, [courses]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        (c.teacherName || '').toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [courses, q, statusFilter]);

  // Open delete modal
  const openDeleteModal = (id: string, title: string) => {
    setCourseToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!courseToDelete) return;

    try {
      const res = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCourses();
      } else {
        alert('Failed to delete course');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting');
    } finally {
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">All Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage courses, pricing, and publishing status.
          </p>
        </div>

        <Link
          href="/dashboard/courses/new"
          className="
            group inline-flex items-center gap-2
            px-4 py-2.5 rounded-xl
            bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            text-white font-semibold text-sm
            shadow-sm hover:shadow-md
            border border-blue-500/50
            transition-all duration-200
            active:scale-95
          "
        >
          <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          Add New Course
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Courses', value: stats.total.toString(), icon: Squares2X2Icon },
          { label: 'Published Courses', value: stats.active.toString(), icon: BookOpenIcon },
          { label: 'Total Students', value: stats.totalStudents.toString(), icon: UsersIcon },
          {
            label: 'Estimated Monthly Revenue',
            value: `$${stats.revenueMonthlyMock.toFixed(0)}`,
            icon: CurrencyDollarIcon,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="
              bg-white dark:bg-gray-800
              rounded-xl
              border border-blue-200 dark:border-blue-800
              shadow-sm
              p-5
              hover:-translate-y-1 hover:shadow-lg
              transition-all duration-200
            "
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title / teacher name / course ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Courses List <span className="text-gray-400 font-normal">({filtered.length})</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Teacher Share</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No matching courses found. Try changing filters or add a new course.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/courses/${c.id}/content`}
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {c.title}
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-gray-700 dark:text-gray-200">
                      {c.teacherName || 'Not specified'}
                    </td>

                    <td className="px-4 py-4 text-gray-700 dark:text-gray-200">
                      ${Number(c.price).toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-gray-700 dark:text-gray-200">
                      {Number(c.teacherSharePct ?? 70).toFixed(0)}%
                    </td>

                    <td className="px-4 py-4 text-gray-700 dark:text-gray-200">
                      {c.students || 0}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          c.status === 'published'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                            : c.status === 'archived'
                            ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {c.status === 'published' ? 'Published' : c.status === 'archived' ? 'Archived' : 'Draft'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/courses/${c.id}/content`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Content
                        </Link>

                        <Link
                          href={`/dashboard/courses/${c.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </Link>

                        <button
                          onClick={() => openDeleteModal(c.id, c.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal - نفس الستايل اللي بعثتيه */}
      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Confirm Delete</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Are you sure you want to delete <strong>{courseToDelete.title}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 rounded-lg bg-blue-950 dark:bg-gray-950 text-white hover:bg-blue-700 transition"
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
