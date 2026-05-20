'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  QueueListIcon,
  TagIcon,
  PencilSquareIcon,
  FunnelIcon,
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
  categoryId?: string | null;
  categoryName?: string | null;
  teacherName: string;
  teacherId: string;
  price: number;
  teacherSharePct: number;
  students: number;
  status: CourseStatus;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkStatus, setBulkStatus] = useState<CourseStatus>('published');

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all');

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (res.ok) {
        const nextCourses = data.courses || [];
        setCourses(nextCourses);
        setSelectedCourseIds((prev) =>
          prev.filter((id) => nextCourses.some((course: Course) => course.id === id))
        );
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        (c.teacherName || '').toLowerCase().includes(query) ||
        (c.categoryName || '').toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [courses, q, statusFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((course) => selectedCourseIds.includes(course.id));

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !filtered.some((course) => course.id === id)));
      return;
    }

    const filteredIds = filtered.map((course) => course.id);
    setSelectedCourseIds((prev) => [...new Set([...prev, ...filteredIds])]);
  };

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

  const handleBulkCategoryAssign = async () => {
    if (selectedCourseIds.length === 0) {
      alert('Select at least one course first');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await fetch('/api/courses/bulk-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: selectedCourseIds,
          categoryId: bulkCategoryId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Failed to assign category');
        return;
      }

      await fetchCourses();
      setSelectedCourseIds([]);
      alert(
        bulkCategoryId
          ? 'Category assigned to selected courses.'
          : 'Selected courses are now uncategorized.'
      );
    } catch (error) {
      console.error('Bulk category assignment failed:', error);
      alert('Failed to assign category');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkStatusAssign = async () => {
    if (selectedCourseIds.length === 0) {
      alert('Select at least one course first');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await fetch('/api/courses/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: selectedCourseIds,
          status: bulkStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Failed to update status');
        return;
      }
      await fetchCourses();
      setSelectedCourseIds([]);
      alert(`Status "${bulkStatus}" applied to selected courses.`);
    } catch (error) {
      console.error('Bulk status assignment failed:', error);
      alert('Failed to update status');
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">All Courses</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage courses, pricing, and publishing status.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1 w-full">
            <Link
              href="/dashboard/courses/new"
              className="
                group inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-sm
                shadow-sm border border-emerald-500/60
                transition-all duration-200 active:scale-95
                whitespace-nowrap
              "
            >
              <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
              Add New Course
            </Link>

            <Link
              href="/dashboard/paths"
              className="
                inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-sm
                shadow-sm border border-emerald-500/60
                transition-all duration-200 active:scale-95
                whitespace-nowrap
              "
            >
              <QueueListIcon className="w-4 h-4" />
              Add Path
            </Link>

            <Link
              href="/dashboard/categories"
              className="
                inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-sm
                shadow-sm border border-emerald-500/60
                transition-all duration-200 active:scale-95
                whitespace-nowrap
              "
            >
              <TagIcon className="w-4 h-4" />
              Add Categories
            </Link>

            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title / teacher name / course ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | CourseStatus)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Selected courses: <span className="font-semibold">{selectedCourseIds.length}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="">Set as Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={bulkSaving || selectedCourseIds.length === 0}
              onClick={handleBulkCategoryAssign}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-4 border-blue-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              {bulkSaving ? 'Applying...' : 'Apply Category'}
            </button>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as CourseStatus)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="draft">Draft</option>
            </select>
            <button
              type="button"
              disabled={bulkSaving || selectedCourseIds.length === 0}
              onClick={handleBulkStatusAssign}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-4 border-blue-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              {bulkSaving ? 'Applying...' : 'Apply Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
        <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Courses List <span className="text-gray-400 font-normal">({filtered.length})</span>
          </p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white dark:bg-slate-900/60">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    aria-label="Select all filtered courses"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Category</th>
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
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No matching courses found. Try changing filters or add a new course.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(c.id)}
                        onChange={() => toggleCourseSelection(c.id)}
                        aria-label={`Select course ${c.title}`}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/courses/${c.id}/content`}
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {c.title}
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {c.categoryName || 'Uncategorized'}
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {c.teacherName || 'Not specified'}
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      ${Number(c.price).toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {Number(c.teacherSharePct ?? 70).toFixed(0)}%
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
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
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Content
                        </Link>

                        <Link
                          href={`/dashboard/courses/${c.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </Link>

                        <button
                          onClick={() => openDeleteModal(c.id, c.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
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

        <div className="md:hidden p-2.5 space-y-2.5">
          {loading ? (
            <div className="px-3 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              No matching courses found. Try changing filters or add a new course.
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={`mobile-${c.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(c.id)}
                      onChange={() => toggleCourseSelection(c.id)}
                      aria-label={`Select course ${c.title}`}
                    />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {c.title}
                    </span>
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border ${
                      c.status === 'published'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                        : c.status === 'archived'
                        ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {c.status === 'published' ? 'Published' : c.status === 'archived' ? 'Archived' : 'Draft'}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="text-slate-500 dark:text-slate-400">Category</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{c.categoryName || 'Uncategorized'}</div>
                  <div className="text-slate-500 dark:text-slate-400">Teacher</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{c.teacherName || 'Not specified'}</div>
                  <div className="text-slate-500 dark:text-slate-400">Price</div>
                  <div className="text-right font-semibold text-slate-800 dark:text-slate-100">${Number(c.price).toFixed(2)}</div>
                  <div className="text-slate-500 dark:text-slate-400">Teacher Share</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{Number(c.teacherSharePct ?? 70).toFixed(0)}%</div>
                  <div className="text-slate-500 dark:text-slate-400">Students</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{c.students || 0}</div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/dashboard/courses/${c.id}/content`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Content
                  </Link>
                  <Link
                    href={`/dashboard/courses/${c.id}/edit`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => openDeleteModal(c.id, c.title)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - نفس الستايل اللي بعثتيه */}
      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
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
                  className="px-6 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/40 transition"
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
