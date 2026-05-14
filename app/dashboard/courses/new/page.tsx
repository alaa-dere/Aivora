'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Teacher = {
  id: string;
  fullName: string;
};

type CourseStatus = 'draft' | 'published' | 'archived';

type CourseForm = {
  title: string;
  description: string;
  teacherId: string;
  price: string;
  durationWeeks: string;
  teacherSharePct: string;
  status: CourseStatus;
};

const MAX_IMAGE_SIZE_MB = 5;

export default function NewCoursePage() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    teacherId: '',
    price: '0.00',
    durationWeeks: '4',
    teacherSharePct: '70.00',
    status: 'draft',
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const res = await fetch('/api/teachers/list', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load teachers');
        }

        setTeachers(data.teachers || []);
      } catch (error: any) {
        setErrorMsg(error.message || 'Failed to load teachers list');
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeachers();
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const handleChange = <K extends keyof CourseForm>(field: K, value: CourseForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file only');
      e.target.value = '';
      return;
    }

    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_IMAGE_SIZE_MB) {
      setErrorMsg(`Image size must be less than ${MAX_IMAGE_SIZE_MB} MB`);
      e.target.value = '';
      return;
    }

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Course title is required';
    if (!form.description.trim()) return 'Course description is required';
    if (!form.teacherId) return 'Please select a teacher';

    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      return 'Price must be a valid number greater than or equal to 0';
    }

    if (Number.isNaN(Number(form.durationWeeks)) || Number(form.durationWeeks) < 1) {
      return 'Duration must be at least 1 week';
    }

    if (
      Number.isNaN(Number(form.teacherSharePct)) ||
      Number(form.teacherSharePct) < 0 ||
      Number(form.teacherSharePct) > 100
    ) {
      return 'Teacher share must be between 0 and 100';
    }

    return null;
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      teacherId: '',
      price: '0.00',
      durationWeeks: '4',
      teacherSharePct: '70.00',
      status: 'draft',
    });
    setCoverFile(null);

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append('title', form.title.trim());
      payload.append('description', form.description.trim());
      payload.append('teacherId', form.teacherId);
      payload.append('price', form.price);
      payload.append('durationWeeks', form.durationWeeks);
      payload.append('teacherSharePct', form.teacherSharePct);
      payload.append('status', form.status);

      if (coverFile) {
        payload.append('image', coverFile);
      }

      const res = await fetch('/api/courses', {
        method: 'POST',
        body: payload,
      });

      const text = await res.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!res.ok) {
        throw new Error(data.message || `Failed to create course (status ${res.status})`);
      }

      resetForm();
      router.push('/dashboard/courses');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-5 shadow-sm mb-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400" />
          <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                aria-label="Back to courses"
                title="Back to courses"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Add New Course</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Fill in the details below to create a new course.
            </p>
          </div>
          <div />
      </div>
      </div>

      <div className="w-full">
        {errorMsg && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Course Basics</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Start with the core details that appear on the course card.
                </p>
              </div>

              <div className="admin-surface flex-1 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Course Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Example: Web Development with Next.js"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Short and attractive description of the course..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teacher <span className="text-red-500">*</span>
                    </label>

                    {loadingTeachers ? (
                      <p className="text-slate-500 dark:text-slate-400">Loading teachers...</p>
                    ) : (
                      <select
                        value={form.teacherId}
                        onChange={(e) => handleChange('teacherId', e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">Not specified</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pricing & Duration</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Set the amount students will pay and the expected time to complete.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="admin-surface rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="admin-surface rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration (Weeks)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.durationWeeks}
                    onChange={(e) => handleChange('durationWeeks', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Example: 8"
                  />
                </div>

                <div className="admin-surface rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teacher Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.teacherSharePct}
                    onChange={(e) => handleChange('teacherSharePct', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Media</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Add a cover image to make the course stand out.
                </p>
              </div>

              <div className="admin-surface rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cover Image (optional - recommended 1280x720 or similar aspect ratio)
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 transition-all file:mr-4 file:rounded-xl file:border file:border-sky-200 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100 dark:text-gray-400 dark:file:border-sky-900 dark:file:bg-slate-900 dark:file:text-sky-300"
                />

                {coverPreview && (
                  <div className="mt-4">
                    <div className="aspect-[16/9] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <img
                        src={coverPreview}
                        alt="Course cover preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Preview (will be uploaded when you submit)
                    </p>
                  </div>
                )}
              </div>

              <div className="admin-surface rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value as CourseStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="draft">Draft (not visible)</option>
                  <option value="published">Published (available for purchase)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="admin-surface px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm hover:bg-sky-200 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800 dark:hover:bg-sky-900/60"
            >
              {submitting ? 'Saving...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
