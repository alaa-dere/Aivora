'use client';

import { useEffect, useState } from 'react';
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create course');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Add New Course
        </h1>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
              placeholder="Short and attractive description of the course..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Teacher <span className="text-red-500">*</span>
            </label>

            {loadingTeachers ? (
              <p className="text-gray-500 dark:text-gray-400">Loading teachers...</p>
            ) : (
              <select
                value={form.teacherId}
                onChange={(e) => handleChange('teacherId', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (Weeks)
              </label>
              <input
                type="number"
                min="1"
                value={form.durationWeeks}
                onChange={(e) => handleChange('durationWeeks', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
                placeholder="Example: 8"
              />
            </div>

            <div>
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cover Image (optional – recommended 1280×720 or similar aspect ratio)
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-950 dark:file:text-blue-300"
            />

            {coverPreview && (
              <div className="mt-4">
                <div className="aspect-[16/9] w-full max-w-md overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100 shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <img
                    src={coverPreview}
                    alt="Course cover preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Preview (will be uploaded when you submit)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Status
            </label>

            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value as CourseStatus)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            >
              <option value="draft">Draft (not visible)</option>
              <option value="published">Published (available for purchase)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-700 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}