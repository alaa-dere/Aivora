'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditCoursePage() {
  const router = useRouter();
  const { id } = useParams();

  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    teacherId: '',
    price: '0.00',
    teacherSharePct: '70.00',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null); // only set if user changes the image

  useEffect(() => {
    async function loadData() {
      try {
        // Load teachers list
        const teachersRes = await fetch('/api/teachers/list');
        if (teachersRes.ok) {
          const tData = await teachersRes.json();
          setTeachers(tData.teachers || []);
        }

        // Load current course data
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select an image file only');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
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
    return <div className="p-10 text-center text-gray-600 dark:text-gray-400">Loading course data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Edit Course
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

          {/* Cover Image - with nice square-like preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image (leave empty to keep current)
            </label>

            {coverPreview && (
              <div className="mt-2 mb-4">
                <div className="w-full max-w-md aspect-[16/9] overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-gray-800">
                  <img
                    src={coverPreview}
                    alt="Current or new course cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Current cover (will be replaced only if you upload a new one)
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300 transition-all"
            />
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
