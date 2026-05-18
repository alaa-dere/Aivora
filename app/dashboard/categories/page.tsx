'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Category = {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive';
  coursesCount: number;
  pathsCount: number;
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('active');
    setEditingCategoryId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddEditModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const isEditing = Boolean(editingCategoryId);
      const endpoint = isEditing ? `/api/categories/${editingCategoryId}` : '/api/categories';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
        return;
      }

      resetForm();
      setIsAddEditModalOpen(false);
      await fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setStatus(category.status);
    setIsAddEditModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?\nCourses and paths under it will become uncategorized.`
    );
    if (!confirmed) return;

    setDeletingId(category.id);
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Failed to delete category');
        return;
      }

      if (editingCategoryId === category.id) {
        resetForm();
      }
      await fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Categories</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organize courses and learning paths by topic.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="group inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold text-xs sm:text-sm shadow-sm border border-emerald-200 transition-all duration-200 active:scale-95 whitespace-nowrap dark:bg-emerald-900/30 dark:hover:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800"
          >
            <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            Add New Category
          </button>
        </div>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Categories ({categories.length})
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Paths</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={5}>
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{category.name}</p>
                      {category.description ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {category.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          category.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {category.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{category.coursesCount}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{category.pathsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          {deletingId === category.id ? 'Deleting...' : 'Delete'}
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
          ) : categories.length === 0 ? (
            <div className="px-3 py-8 text-sm text-slate-500">No categories yet.</div>
          ) : (
            categories.map((category) => (
              <div
                key={`mobile-${category.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
              >
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{category.name}</p>
                {category.description ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{category.description}</p>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                      category.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {category.status}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Courses: {category.coursesCount} | Paths: {category.pathsCount}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px]"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] disabled:opacity-60"
                  >
                    <TrashIcon className="w-4 h-4" />
                    {deletingId === category.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h2>
              <button
                onClick={() => {
                  setIsAddEditModalOpen(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name (e.g. Web Development)"
                  className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEditModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-6 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/40 transition disabled:opacity-60"
                >
                  {saving ? (editingCategoryId ? 'Saving...' : 'Creating...') : editingCategoryId ? 'Save Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
