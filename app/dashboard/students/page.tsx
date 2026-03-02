'use client';

import { useMemo, useState } from 'react';
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
  name: string;
  email: string;
  status: Status;
  createdAt: string;
  coursesCount: number;
  balance: number;
};

const initialStudents: StudentRow[] = [
  {
    id: 'U-1001',
    name: 'Ahmad Saleh',
    email: 'ahmad@aivora.com',
    status: 'active',
    createdAt: '2026-01-11',
    coursesCount: 3,
    balance: 40,
  },
  {
    id: 'U-1002',
    name: 'Sara Ali',
    email: 'sara@aivora.com',
    status: 'active',
    createdAt: '2026-01-22',
    coursesCount: 1,
    balance: 10,
  },
];

function statusBadge(status: Status) {
  if (status === 'active') {
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
  }
  return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    status: 'active' as Status,
    balance: '0',
  });

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || s.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [students, q, statusFilter]);

  function openCreate() {
    setModalMode('create');
    setForm({ name: '', email: '', status: 'active', balance: '0' });
    setOpenModal(true);
  }

  function openEdit(s: StudentRow) {
    setModalMode('edit');
    setEditingId(s.id);
    setForm({
      name: s.name,
      email: s.email,
      status: s.status,
      balance: String(s.balance),
    });
    setOpenModal(true);
  }

  function saveStudent() {
    if (!form.name || !form.email) return;

    if (modalMode === 'create') {
      const newStudent: StudentRow = {
        id: `U-1${Math.floor(1000 + Math.random() * 9000)}`,
        name: form.name,
        email: form.email,
        status: form.status,
        createdAt: new Date().toISOString().slice(0, 10),
        coursesCount: 0,
        balance: Number(form.balance),
      };
      setStudents((prev) => [newStudent, ...prev]);
    } else {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, ...form, balance: Number(form.balance) }
            : s
        )
      );
    }

    setOpenModal(false);
  }

  function doDelete() {
    if (!deleteId) return;
    setStudents((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Students
        </h1>

        <button
          onClick={openCreate}
          className="group px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 active:scale-95"
        >
          <PlusIcon className="w-5 h-5 inline mr-2 group-hover:rotate-90 transition-transform" />
          Add Student
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Courses</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:-translate-y-0.5 transition-all duration-200"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 transition-colors"
                    >
                      {s.name}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {s.email} • {s.id} • Balance: ${s.balance}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full border text-xs ${statusBadge(s.status)}`}>
                    {s.status === 'active' ? (
                      <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 inline mr-1" />
                    )}
                    {s.status}
                  </span>
                </td>

                <td className="px-4 py-3">{s.coursesCount}</td>
                <td className="px-4 py-3">{s.createdAt}</td>

                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/dashboard/students/${s.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:-translate-y-1 transition-all duration-200 text-sm"
                  >
                    View
                  </Link>

                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:-translate-y-1 transition-all duration-200 text-sm"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:-translate-y-1 transition-all duration-200 text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-900/40">
            <div className="px-6 py-3 bg-blue-950 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {modalMode === 'create' ? 'Add Student' : 'Edit Student'}
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border"
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border"
              />
              <input
                placeholder="Balance"
                type="number"
                value={form.balance}
                onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border"
              />
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
              <button
                onClick={() => setOpenModal(false)}
                className="px-5 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={saveStudent}
                className="px-6 py-2 rounded-lg bg-blue-950 text-white"
              >
                {modalMode === 'create' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl">
            <p className="mb-4">Delete this student?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}>Cancel</button>
              <button onClick={doDelete} className="text-white bg-blue-950 px-4 py-2 rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}