'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Course = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  categoryId?: string | null;
  price?: number;
  durationWeeks?: number | null;
};

type Category = {
  id: string;
  name: string;
};

type LearningPath = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
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

const MAX_IMAGE_SIZE_MB = 5;

export default function AdminPathsPage() {
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>(
    'beginner'
  );
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [estimatedHours, setEstimatedHours] = useState('0');
  const [estimatedHoursLoading, setEstimatedHoursLoading] = useState(false);
  const [price, setPrice] = useState('0');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const availableCourses = useMemo(() => {
    const activeCourses = courses.filter((course) => course.status !== 'archived');
    if (!categoryId) return [];
    return activeCourses.filter((course) => (course.categoryId || '') === categoryId);
  }, [courses, categoryId]);

  const selectedCoursesTotal = useMemo(
    () =>
      selectedCourseIds.reduce((sum, courseId) => {
        const course = courses.find((item) => item.id === courseId);
        return sum + Number(course?.price || 0);
      }, 0),
    [selectedCourseIds, courses]
  );

  const discountedTotal = useMemo(
    () => Number((selectedCoursesTotal * 0.9).toFixed(2)),
    [selectedCoursesTotal]
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

  useEffect(() => {
    if (!categoryId) {
      setSelectedCourseIds([]);
      return;
    }
    const allowedIds = new Set(
      courses
        .filter((course) => (course.categoryId || '') === categoryId && course.status !== 'archived')
        .map((course) => course.id)
    );
    setSelectedCourseIds((prev) => prev.filter((id) => allowedIds.has(id)));
  }, [categoryId, courses]);

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  useEffect(() => {
    setPrice(discountedTotal.toFixed(2));
  }, [discountedTotal]);

  useEffect(() => {
    let cancelled = false;

    const computeEstimatedHours = async () => {
      if (selectedCourseIds.length === 0) {
        setEstimatedHours('0');
        return;
      }

      setEstimatedHoursLoading(true);
      try {
        if (cancelled) return;
        const totalWeeks = selectedCourseIds.reduce((sum, courseId) => {
          const matched = courses.find((course) => course.id === courseId);
          return sum + Number(matched?.durationWeeks || 0);
        }, 0);
        setEstimatedHours(String(totalWeeks));
      } catch (error) {
        if (!cancelled) {
          console.error('Failed computing estimated weeks from selected courses:', error);
          setEstimatedHours('0');
        }
      } finally {
        if (!cancelled) {
          setEstimatedHoursLoading(false);
        }
      }
    };

    computeEstimatedHours();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseIds, courses]);

  const resetForm = () => {
    setEditingPathId(null);
    setTitle('');
    setDescription('');
    setCoverFile(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
    setExistingImageUrl(null);
    setCategoryId('');
    setLevel('beginner');
    setStatus('draft');
    setEstimatedHours('0');
    setPrice('0');
    setSelectedCourseIds([]);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddEditModalOpen(true);
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

      const payload = new FormData();
      payload.append('title', title.trim());
      payload.append('description', description.trim());
      payload.append('categoryId', categoryId || '');
      payload.append('level', level);
      payload.append('status', status);
      payload.append('estimatedHours', String(Number(estimatedHours || 0)));
      payload.append('price', String(Number(price || 0)));
      payload.append('courseIds', JSON.stringify(selectedCourseIds));
      if (coverFile) {
        payload.append('image', coverFile);
      }

      const res = await fetch(endpoint, {
        method,
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || `Failed to ${isEditing ? 'update' : 'create'} path`);
        return;
      }

      resetForm();
      setIsAddEditModalOpen(false);
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
    setCoverFile(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
    setExistingImageUrl(path.imageUrl || null);
    setCategoryId(path.categoryId || '');
    setLevel((path.level as 'beginner' | 'intermediate' | 'advanced' | 'all_levels') || 'beginner');
    setStatus(path.status || 'draft');
    setEstimatedHours(String(Number(path.estimatedHours || 0)));
    setPrice(String(Number(path.price || 0)));
    setSelectedCourseIds(path.courseIds || []);
    setIsAddEditModalOpen(true);
  };

  const handleDelete = (path: LearningPath) => {
    setPathToDelete(path);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pathToDelete) return;

    setDeletingId(pathToDelete.id);
    try {
      const res = await fetch(`/api/paths/${pathToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Failed to delete path');
        return;
      }

      if (editingPathId === pathToDelete.id) {
        resetForm();
      }
      setIsDeleteModalOpen(false);
      setPathToDelete(null);
      await fetchAll();
    } catch (error) {
      console.error('Failed deleting path:', error);
      alert('Failed to delete path');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file only');
      e.target.value = '';
      return;
    }
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_IMAGE_SIZE_MB) {
      alert(`Image size must be less than ${MAX_IMAGE_SIZE_MB} MB`);
      e.target.value = '';
      return;
    }
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6 transition-colors duration-300 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-5 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400" />
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Learning Paths</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create guided course bundles students can enroll in as one path.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="group inline-flex min-w-[140px] sm:min-w-[170px] items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800 dark:hover:bg-emerald-900/40 font-semibold text-xs sm:text-sm shadow-sm transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            Add New Path
          </button>
        </div>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Paths ({paths.length})
        </div>
        <div className="hidden md:block overflow-x-auto">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(path)}
                          disabled={deletingId === path.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
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

        <div className="md:hidden p-2.5 space-y-2.5">
          {loading ? (
            <div className="px-3 py-8 text-sm text-slate-500">Loading...</div>
          ) : paths.length === 0 ? (
            <div className="px-3 py-8 text-sm text-slate-500">No learning paths yet.</div>
          ) : (
            paths.map((path) => (
              <div
                key={`mobile-${path.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
              >
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{path.title}</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="text-slate-500 dark:text-slate-400">Category</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{path.categoryName || 'Uncategorized'}</div>
                  <div className="text-slate-500 dark:text-slate-400">Level</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{path.level}</div>
                  <div className="text-slate-500 dark:text-slate-400">Price</div>
                  <div className="text-right font-semibold text-slate-800 dark:text-slate-100">${Number(path.price || 0).toFixed(2)}</div>
                  <div className="text-slate-500 dark:text-slate-400">Courses</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{path.coursesCount}</div>
                  <div className="text-slate-500 dark:text-slate-400">Students</div>
                  <div className="text-right text-slate-700 dark:text-slate-300">{path.enrolledStudents}</div>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                      path.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : path.status === 'archived'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {path.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(path)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-[11px]"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(path)}
                    disabled={deletingId === path.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-[11px] disabled:opacity-60"
                  >
                    <TrashIcon className="w-4 h-4" />
                    {deletingId === path.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="admin-surface w-full max-w-3xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold">{editingPathId ? 'Edit Path' : 'Add New Path'}</h2>
              <button
                onClick={() => {
                  setIsAddEditModalOpen(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-3 sm:space-y-5 overflow-y-auto max-h-[calc(92vh-64px)] sm:max-h-[calc(92vh-72px)]">
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Path title (e.g. Frontend Developer Path)"
                  className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                />
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Path description"
                  className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid md:grid-cols-[1fr_auto] gap-3 items-start">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Path Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="admin-surface w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-blue-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-200"
                  />
                </div>
                <div className="pt-[25px]">
                  <div className="h-40 w-64 rounded-md border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Path preview" className="h-full w-full object-cover" />
                    ) : existingImageUrl ? (
                      <img src={existingImageUrl} alt="Path preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-slate-400">Preview</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-[1.35fr_1fr_0.8fr_1fr_1fr] gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) =>
                      setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'all_levels')
                    }
                    className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all_levels">All Levels</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                    className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Estimated Weeks
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedHours}
                    onChange={(e) => {
                      setEstimatedHours(e.target.value);
                    }}
                    placeholder="Estimated weeks"
                    className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {estimatedHoursLoading
                      ? 'Calculating from selected course durations...'
                      : 'Auto-calculated from selected course durations'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Path Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Path price"
                    className="admin-surface w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 text-sm text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Courses total: ${selectedCoursesTotal.toFixed(2)} | After 10% discount: $
                    {discountedTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select courses and order (selection order is path order)
                </p>
                {!categoryId ? (
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-300">
                    Select a category first to show matching courses.
                  </p>
                ) : availableCourses.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    No courses found under this category.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-2 max-h-44 sm:max-h-56 overflow-auto">
                    {availableCourses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-1.5"
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
                )}
              </div>

              <div className="flex justify-end gap-2 sm:gap-4 mt-2 sm:mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEditModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 sm:px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="px-4 sm:px-6 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/40 transition disabled:opacity-60"
                >
                  {saving ? (editingPathId ? 'Saving...' : 'Creating...') : editingPathId ? 'Save Path' : 'Add Path'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && pathToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Delete Path</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-white hover:text-gray-200 transition">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                Delete learning path <span className="font-semibold">"{pathToDelete.title}"</span>? All enrollments and course mapping in this path will be removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId === pathToDelete.id}
                  className="px-6 py-2 rounded-lg bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 dark:bg-slate-900/40 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/20 transition disabled:opacity-60"
                >
                  {deletingId === pathToDelete.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



