'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';

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

export default function EditCoursePage() {
  const router = useRouter();
  const { id } = useParams();

  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    teacherId: '',
    price: '0.00',
    durationWeeks: '4',
    teacherSharePct: '70.00',
    status: 'draft',
  });

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null); // only set if user changes the image

  useEffect(() => {
    async function loadData() {
      try {
        const teachersRes = await fetch('/api/teachers/list', { cache: 'no-store' });
        if (teachersRes.ok) {
          const tData = await teachersRes.json();
          setTeachers(tData.teachers || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load teachers list');
      } finally {
        setLoadingTeachers(false);
      }

      try {
        const courseRes = await fetch(`/api/courses/${id}`);
        if (!courseRes.ok) {
          throw new Error('Failed to fetch course data');
        }
        const courseData = await courseRes.json();
        const c = courseData.course;

        if (c) {
          setForm({
            title: c.title || '',
            description: c.description || '',
            teacherId: c.teacherId || '',
            price: Number(c.price ?? 0).toFixed(2),
            durationWeeks: String(Number(c.durationWeeks ?? 4)),
            teacherSharePct: Number(c.teacherSharePct ?? 70).toFixed(2),
            status: c.status || 'draft',
          });

          if (c.imageUrl) {
            setCoverPreview(c.imageUrl);
          }
        } else {
          setErrorMsg('Course not found');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred while loading');
      } finally {
        setLoading(false);
      }
    }

    if (id) loadData();
  }, [id]);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) {
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

    if (coverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    if (!form.title.trim() || !form.description.trim() || !form.teacherId) {
      setErrorMsg('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title.trim());
    payload.append('description', form.description.trim());
    payload.append('teacherId', form.teacherId);
    payload.append('price', form.price);
    payload.append('teacherSharePct', form.teacherSharePct);
    payload.append('durationWeeks', form.durationWeeks);
    payload.append('status', form.status);

    // Only append new image if user selected one
    if (coverFile) {
      payload.append('image', coverFile);
    }

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        body: payload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update course');
      }

      router.push(`/dashboard/courses/${id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/80 dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
        <div className="p-10 text-center text-gray-600 dark:text-gray-400">
          Loading course data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Back to courses"
                title="Back to courses"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Edit Course</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Update course details, pricing, and status.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-blue-900 bg-blue-950 p-5 shadow-md dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold text-white">Course Basics</h2>
            <p className="text-sm text-blue-200 mt-1">
              Start with the core details that appear on the course card.
            </p>
          </div>

          <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Example: Web Development with Next.js"
            />
          </div>

          <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Short and attractive description of the course..."
            />
          </div>

          <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Not specified</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-2xl border border-blue-900 bg-blue-950 p-5 shadow-md dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold text-white">Pricing & Duration</h2>
            <p className="text-sm text-blue-200 mt-1">
              Set the amount students will pay and the expected time to complete.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (Weeks)
              </label>
              <input
                type="number"
                min="1"
                value={form.durationWeeks}
                onChange={(e) => handleChange('durationWeeks', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Example: 8"
              />
            </div>

            <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-900 bg-blue-950 p-5 shadow-md dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-lg font-semibold text-white">Media</h2>
            <p className="text-sm text-blue-200 mt-1">
              Add a cover image to make the course stand out.
            </p>
          </div>

          <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cover Image (leave empty to keep current)
            </label>

            {coverPreview && (
              <div className="mt-4">
                <div className="aspect-[16/9] w-full max-w-md overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <img
                    src={coverPreview}
                    alt="Current or new course cover"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Current cover (will be replaced only if you upload a new one)
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-950 dark:file:text-blue-300"
            />
          </div>

          <div className="admin-surface rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-800 dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Status
            </label>

            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value as CourseStatus)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="draft">Draft (not visible)</option>
              <option value="published">Published (available for purchase)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="admin-surface px-6 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm shadow-md hover:shadow-md border border-blue-500/50 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
