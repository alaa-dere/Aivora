'use client';

import { useMemo, useState } from 'react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type Role = 'student' | 'teacher';
type Status = 'active' | 'inactive';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string; // simple display
  coursesCount: number;
  balance?: number; // for student use-case
};

const initialUsers: UserRow[] = [
  {
    id: 'U-1001',
    name: 'Ahmad Saleh',
    email: 'ahmad@aivora.com',
    role: 'student',
    status: 'active',
    createdAt: '2026-01-11',
    coursesCount: 3,
    balance: 40,
  },
  {
    id: 'U-1002',
    name: 'Sara Ali',
    email: 'sara@aivora.com',
    role: 'student',
    status: 'active',
    createdAt: '2026-01-22',
    coursesCount: 1,
    balance: 10,
  },
  {
    id: 'U-2001',
    name: 'Mohammad Hasan',
    email: 'mohammad@aivora.com',
    role: 'teacher',
    status: 'active',
    createdAt: '2025-12-10',
    coursesCount: 5,
  },
  {
    id: 'U-2002',
    name: 'Lina Omar',
    email: 'lina@aivora.com',
    role: 'teacher',
    status: 'inactive',
    createdAt: '2025-11-05',
    coursesCount: 2,
  },
];

function roleLabel(role: Role) {
  return role === 'student' ? 'Student' : 'Teacher';
}

function roleBadge(role: Role) {
  if (role === 'student') {
    return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800';
  }
  return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800';
}

function statusBadge(status: Status) {
  if (status === 'active') {
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
  }
  return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
}

type ModalMode = 'create' | 'edit';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);

  const [tab, setTab] = useState<'all' | 'students' | 'teachers'>('all');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  // modal state
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // form
  const [form, setForm] = useState<{
    name: string;
    email: string;
    role: Role;
    status: Status;
    balance: string; // as text
  }>({
    name: '',
    email: '',
    role: 'student',
    status: 'active',
    balance: '0',
  });

  const stats = useMemo(() => {
    const students = users.filter((u) => u.role === 'student').length;
    const teachers = users.filter((u) => u.role === 'teacher').length;
    const active = users.filter((u) => u.status === 'active').length;
    return { students, teachers, active, total: users.length };
  }, [users]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return users.filter((u) => {
      const matchesTab =
        tab === 'all' || (tab === 'students' && u.role === 'student') || (tab === 'teachers' && u.role === 'teacher');

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query);

      return matchesTab && matchesStatus && matchesQuery;
    });
  }, [users, tab, statusFilter, q]);

  function resetForm() {
    setForm({
      name: '',
      email: '',
      role: 'student',
      status: 'active',
      balance: '0',
    });
    setEditingId(null);
  }

  function openCreate() {
    setModalMode('create');
    resetForm();
    setOpenModal(true);
  }

  function openEdit(u: UserRow) {
    setModalMode('edit');
    setEditingId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      balance: String(u.balance ?? 0),
    });
    setOpenModal(true);
  }

  function saveUser() {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || !email) return;

    if (modalMode === 'create') {
      const newId =
        form.role === 'teacher'
          ? `U-2${Math.floor(1000 + Math.random() * 9000)}`
          : `U-1${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser: UserRow = {
        id: newId,
        name,
        email,
        role: form.role,
        status: form.status,
        createdAt: new Date().toISOString().slice(0, 10),
        coursesCount: 0,
        balance: form.role === 'student' ? Number(form.balance || 0) : undefined,
      };

      setUsers((prev) => [newUser, ...prev]);
    } else {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== editingId) return u;
          return {
            ...u,
            name,
            email,
            role: form.role,
            status: form.status,
            balance: form.role === 'student' ? Number(form.balance || 0) : undefined,
          };
        })
      );
    }

    setOpenModal(false);
    resetForm();
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  function doDelete() {
    if (!deleteId) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-7 h-7 text-blue-700 dark:text-blue-400" />
            Users
          </h1>
         
        </div>
<button
  onClick={openCreate}
  className="
    group inline-flex items-center gap-2
    px-4 py-2.5
    rounded-xl
    bg-gradient-to-r from-blue-600 to-blue-700
    hover:from-blue-700 hover:to-blue-800
    text-white
    font-semibold text-sm
    shadow-sm
    hover:shadow-md
    border border-blue-500/50
    transition-all duration-200
    active:scale-95
  "
>
  <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
  Add User
</button>
      </div>
{/* Stats - small admin style */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {[
    {
      label: 'Total Students',
      value: stats.students.toLocaleString(),
      trend: '+6.2%',
      icon: AcademicCapIcon,
    },
    {
      label: 'Total Teachers',
      value: stats.teachers.toLocaleString(),
      trend: '+1.4%',
      icon: UserGroupIcon,
    },
    {
      label: 'Total Users',
      value: stats.total.toLocaleString(),
      trend: '+3.1%',
      icon: Squares2X2Icon,
    },
    {
      label: 'Active Users',
      value: stats.active.toLocaleString(),
      trend: '+9.8%',
      icon: CheckBadgeIcon,
    },
  ].map((card) => (
    <div
      key={card.label}
      className="
        bg-white dark:bg-gray-800
        rounded-xl
        border border-blue-200 dark:border-blue-800
        shadow-sm
        p-4
        transition-all duration-200
        hover:-translate-y-1 hover:shadow-md
      "
    >
      {/* top */}
      <div className="flex items-center justify-between">
        {/* icon */}
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </div>

        {/* percent */}
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {card.trend}
        </span>
      </div>

      {/* numbers */}
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {card.value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {card.label}
        </div>
      </div>
    </div>
  ))}
</div>


      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'students', label: 'Students' },
              { key: 'teachers', label: 'Teachers' },
            ].map((t) => {
              const active = tab === (t.key as any);
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name / email / id..."
                className="w-full sm:w-80 pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Users List <span className="text-gray-400 font-normal">({filtered.length})</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Courses</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{u.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {u.email} • <span className="font-mono">{u.id}</span>
                        {u.role === 'student' ? (
                          <span className="ml-2 text-gray-400">
                            • Balance: <span className="font-semibold">${u.balance ?? 0}</span>
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${roleBadge(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadge(u.status)}`}>
                      {u.status === 'active' ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : (
                        <XCircleIcon className="w-4 h-4" />
                      )}
                      {u.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.coursesCount}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.createdAt}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => confirmDelete(u.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No users found. Try changing filters or add a new user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setOpenModal(false)} />
          <div className="relative w-[94%] max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {modalMode === 'create' ? 'Add User' : 'Edit User'}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="name@email.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Status }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Student-only field */}
              {form.role === 'student' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Balance</label>
                  <input
                    value={form.balance}
                    onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                    type="number"
                    min={0}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    (For enrollment & wallet features)
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 transition-colors"
              >
                {modalMode === 'create' ? 'Create' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative w-[94%] max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-red-200 dark:border-red-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Delete user?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This action can’t be undone.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}