'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    teacherId: '',
    price: '0.00',
    teacherSharePct: '70.00',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await fetch('/api/teachers/list');
        if (!res.ok) throw new Error('Failed to load teachers');
        const data = await res.json();
        setTeachers(data.teachers || []);
      } catch {
        setErrorMsg('Failed to load teachers list');
      } finally {
        setLoadingTeachers(false);
      }
    }
    loadTeachers();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file only');
      return;
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
    payload.append('status', form.status);

    if (coverFile) {
      payload.append('coverImage', coverFile);
    }

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create course');
      }

      router.push('/admin/courses');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Add New Course
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">

          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Example: Web Development with Next.js"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Short and attractive description of the course..."
            />
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teacher <span className="text-red-500">*</span>
            </label>
            {loadingTeachers ? (
              <p className="text-gray-500">Loading teachers...</p>
            ) : (
              <select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Select a teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Price + Teacher Share */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teacher Share (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.teacherSharePct}
                onChange={(e) => setForm({ ...form, teacherSharePct: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Cover Image - with square-like preview box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image (optional – recommended 1280×720 or similar aspect ratio)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300 transition-all"
            />

            {coverPreview && (
              <div className="mt-4">
                <div className="w-full max-w-md aspect-[16/9] overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-gray-800">
                  <img
                    src={coverPreview}
                    alt="Course cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Preview (will be uploaded when you submit)
                </p>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="draft">Draft (not visible)</option>
              <option value="published">Published (available for purchase)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}