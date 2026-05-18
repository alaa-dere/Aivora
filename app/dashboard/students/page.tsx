'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

type Status = 'active' | 'inactive';

type StudentRow = {
  id: string;
  fullName: string;
  email: string;
  status: Status;
  createdAt: string;
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  // Add/Edit Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    password: '',
    status: 'active' as Status,
  });
  const [modalError, setModalError] = useState('');

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (res.ok) {
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesQuery =
        !searchQuery ||
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const filteredCount = filteredStudents.length;

  // Open modal for Add
  function openAddModal() {
    setModalMode('add');
    setFormData({ id: '', fullName: '', email: '', password: '', status: 'active' });
    setModalError('');
    setIsAddEditModalOpen(true);
  }

  // Open modal for Edit
  function openEditModal(student: StudentRow) {
    setModalMode('edit');
    setFormData({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      password: '',
      status: student.status,
    });
    setModalError('');
    setIsAddEditModalOpen(true);
  }

  // Open delete modal
  function openDeleteModal(student: StudentRow) {
    setStudentToDelete(student);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  }

  // Handle Add/Edit submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');

    if (!formData.fullName || !formData.email) {
      setModalError('Full Name and Email are required');
      return;
    }

    if (modalMode === 'add' && !formData.password) {
      setModalError('Password is required for new student');
      return;
    }

    try {
      let res;

      if (modalMode === 'add') {
        res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch('/api/students', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: formData.id,
            fullName: formData.fullName,
            email: formData.email,
            status: formData.status,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.message || `Failed to ${modalMode === 'add' ? 'add' : 'update'} student`);
        return;
      }

      if (modalMode === 'add') {
        setStudents((prev) => [data.student, ...prev]);
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === formData.id ? data.student : s))
        );
      }

      setIsAddEditModalOpen(false);
      setFormData({ id: '', fullName: '', email: '', password: '', status: 'active' });
    } catch (err) {
      setModalError('Server connection error');
    }
  }

  // Handle Delete
  async function handleDelete() {
    if (!studentToDelete) return;

    try {
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: studentToDelete.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message || 'Failed to delete student. Please try again.');
        return;
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));

      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      setDeleteError('');
    } catch (err) {
      setDeleteError('Server connection error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">All Students</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student accounts, enrollments, and status.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1 max-w-2xl">
            <button
              onClick={openAddModal}
              className="
                group inline-flex items-center justify-center gap-2
                px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-xs sm:text-sm
                shadow-sm border border-emerald-500/60
                transition-all duration-200 active:scale-95
                whitespace-nowrap
              "
            >
              <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
              Add New Student
            </button>
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name / email..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
        {/* Title with filtered count */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            Students List <span className="text-gray-400 font-normal">({filteredCount})</span>
          </p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-white dark:bg-slate-900/60">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="w-[20%] sm:w-auto px-2 sm:px-4 py-2.5 sm:py-3 font-medium">Name</th>
                <th className="w-[38%] sm:w-auto px-2 sm:px-4 py-2.5 sm:py-3 font-medium">Email</th>
                <th className="w-[18%] sm:w-auto px-2 sm:px-4 py-2.5 sm:py-3 font-medium">Status</th>
                <th className="w-[24%] sm:w-auto px-2 sm:px-4 py-2.5 sm:py-3 font-medium">Registration Date</th>
                <th className="hidden sm:table-cell px-2 sm:px-4 py-2.5 sm:py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No students found. Try changing filters or add a new student.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-2 sm:px-4 py-3 sm:py-4 align-top">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {student.fullName}
                      </span>
                    </td>

                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-slate-700 dark:text-slate-200 break-words">
                      {student.email}
                    </td>

                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          student.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                        }`}
                      >
                        {student.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {new Date(student.createdAt).toLocaleDateString('en-US')}
                    </td>

                    <td className="hidden sm:table-cell px-2 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="inline-flex items-center gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Link>

                        <button
                          onClick={() => openEditModal(student)}
                          className="inline-flex items-center gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => openDeleteModal(student)}
                          className="inline-flex items-center gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
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
          ) : filteredStudents.length === 0 ? (
            <div className="px-3 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              No students found. Try changing filters or add a new student.
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={`mobile-${student.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{student.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{student.email}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border ${
                      student.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                    }`}
                  >
                    {student.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(student.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => openEditModal(student)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(student)}
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

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add New Student' : 'Edit Student'}
              </h2>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {modalError && (
                <div className="text-red-600 bg-red-50 p-3 rounded-lg text-center">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  type="text"
                  placeholder="Student name"
                  className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  placeholder="student@example.com"
                  className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    type="password"
                    placeholder="••••••••"
                    className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                  className="admin-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/40 transition"
                >
                  {modalMode === 'add' ? 'Add Student' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Confirm Delete</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError('');
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  {deleteError}
                </div>
              )}
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Are you sure you want to delete <strong>{studentToDelete.fullName}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteError('');
                  }}
                  className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/40 transition"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
