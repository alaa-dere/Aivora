'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
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

  // Modal states
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

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);

  // Load students
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

  // Open delete confirmation
  function openDeleteModal(student: StudentRow) {
    setStudentToDelete(student);
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

      // Update the list
      if (modalMode === 'add') {
        setStudents((prev) => [data.student, ...prev]);
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === formData.id ? data.student : s))
        );
      }

      // Close modal
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
        alert(data.message || 'Failed to delete student');
        return;
      }

      // Remove from list
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));

      // Close modal
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (err) {
      alert('Server connection error');
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesQuery =
      !searchQuery ||
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
           All Students
        </h1>

        <button
          onClick={openAddModal}
          className="group px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 active:scale-95"
        >
          <PlusIcon className="w-5 h-5 inline mr-2 group-hover:rotate-90 transition-transform" />
          Add New Student
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="pl-10 pr-3 py-2 w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-300 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-1/5 px-4 py-4 text-center font-medium text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="w-1/4 px-4 py-4 text-center font-medium text-gray-700 dark:text-gray-300">
                  Email
                </th>
                <th className="w-1/6 px-4 py-4 text-center font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="w-1/6 px-4 py-4 text-center font-medium text-gray-700 dark:text-gray-300">
                  Registration Date
                </th>
                <th className="w-1/6 px-4 py-4 text-center font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <td className="px-4 py-4 text-center text-gray-900 dark:text-white font-medium">
                      {student.fullName}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300 truncate">
                      {student.email}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {student.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300">
                      {student.createdAt}
                    </td>
                    <td className="px-4 py-4 text-center flex items-center justify-center gap-6">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-amber-600 hover:text-amber-800 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(student)}
                        className="text-red-600 hover:text-red-800 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No students registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r  bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="px-6 py-2 rounded-lg  bg-blue-950 dark:bg-gray-950 text-white hover:bg-blue-700 transition"
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
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r  bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
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
                Are you sure you want to delete <strong>{studentToDelete.fullName}</strong>?
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
                  className="px-6 py-2 rounded-lg  bg-blue-950 dark:bg-gray-950 text-white hover:bg-blue-700 transition"
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