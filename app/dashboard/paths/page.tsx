'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Course = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
};

type Category = {
  id: string;
  name: string;
};

type LearningPath = {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  estimatedHours: number;
  categoryId?: string | null;
  categoryName?: string | null;
  courseIds?: string[];
  coursesCount: number;
  enrolledStudents: number;
};

export default function AdminPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>(
    'beginner'
  );
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [estimatedHours, setEstimatedHours] = useState('0');
  const [price, setPrice] = useState('0');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const availableCourses = useMemo(
    () => courses.filter((course) => course.status !== 'archived'),
    [courses]
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pathsRes, categoriesRes, coursesRes] = await Promise.all([
        fetch('/api/paths', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/courses', { cache: 'no-store' }),
      ]);
      const [pathsData, categoriesData, coursesData] = await Promise.all([
        pathsRes.json(),
        categoriesRes.json(),
        coursesRes.json(),
      ]);

      if (pathsRes.ok) setPaths(pathsData.paths || []);
      if (categoriesRes.ok) setCategories(categoriesData.categories || []);
      if (coursesRes.ok) setCourses(coursesData.courses || []);
    } catch (error) {
      console.error('Failed loading paths data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setEditingPathId(null);
    setTitle('');
    setDescription('');
    setCategoryId('');
    setLevel('beginner');
    setStatus('draft');
    setEstimatedHours('0');
    setPrice('0');
    setSelectedCourseIds([]);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const isEditing = Boolean(editingPathId);
      const endpoint = isEditing ? `/api/paths/${editingPathId}` : '/api/paths';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          level,
          status,
          estimatedHours: Number(estimatedHours || 0),
          price: Number(price || 0),
          courseIds: selectedCourseIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || `Failed to ${isEditing ? 'update' : 'create'} path`);
        return;
      }

      resetForm();
      await fetchAll();
    } catch (error) {
      console.error('Failed saving path:', error);
      alert('Failed to save path');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (path: LearningPath) => {
    setEditingPathId(path.id);
    setTitle(path.title);
    setDescription(path.description || '');
    setCategoryId(path.categoryId || '');
    setLevel((path.level as 'beginner' | 'intermediate' | 'advanced' | 'all_levels') || 'beginner');
    setStatus(path.status || 'draft');
    setEstimatedHours(String(Number(path.estimatedHours || 0)));
    setPrice(String(Number(path.price || 0)));
    setSelectedCourseIds(path.courseIds || []);
  };

  const handleDelete = async (path: LearningPath) => {
    const confirmed = window.confirm(
      `Delete learning path "${path.title}"?\nAll enrollments and course mapping in this path will be removed.`
    );
    if (!confirmed) return;

    setDeletingId(path.id);
    try {
      const res = await fetch(`/api/paths/${path.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Failed to delete path');
        return;
      }

      if (editingPathId === path.id) {
        resetForm();
      }
      await fetchAll();
    } catch (error) {
      console.error('Failed deleting path:', error);
      alert('Failed to delete path');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Learning Paths</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create guided course bundles students can enroll in as one path.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="admin-surface bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid gap-3"
      >
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Path title (e.g. Frontend Developer Path)"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Path description"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="grid md:grid-cols-5 gap-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'all_levels')
            }
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="all_levels">All Levels</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <input
            type="number"
            min={0}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="Estimated hours"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />

          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Path price"
            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select courses and order (selection order is path order)
          </p>
          <div className="grid md:grid-cols-2 gap-2 max-h-56 overflow-auto">
            {availableCourses.map((course) => (
              <label
                key={course.id}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                />
                <span>{course.title}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          <PlusIcon className="w-4 h-4" />
          {saving ? (editingPathId ? 'Saving...' : 'Creating...') : editingPathId ? 'Save Path' : 'Add Path'}
        </button>

        {editingPathId ? (
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel Edit
          </button>
        ) : null}
      </form>

      <div className="admin-surface bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Paths ({paths.length})
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : paths.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={8}>
                    No learning paths yet.
                  </td>
                </tr>
              ) : (
                paths.map((path) => (
                  <tr key={path.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {path.title}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {path.categoryName || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{path.level}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      ${Number(path.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{path.coursesCount}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {path.enrolledStudents}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          path.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : path.status === 'archived'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {path.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(path)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(path)}
                          disabled={deletingId === path.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          {deletingId === path.id ? 'Deleting...' : 'Delete'}
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
    </div>
  );
}
