'use client';

import { useMemo, useState } from 'react';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  UsersIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type CourseStatus = 'active' | 'paused';

type Course = {
  id: string;
  title: string;
  teacherName: string;
  price: number; // USD (or your currency)
  teacherSharePct: number; // %
  students: number;
  status: CourseStatus;
  createdAt: string; // YYYY-MM-DD
};

const initialCourses: Course[] = [
  {
    id: 'C-1001',
    title: 'English Basics A1',
    teacherName: 'Mohammad Hasan',
    price: 49,
    teacherSharePct: 60,
    students: 112,
    status: 'active',
    createdAt: '2026-01-12',
  },
  {
    id: 'C-1002',
    title: 'Math Fundamentals',
    teacherName: 'Lina Omar',
    price: 39,
    teacherSharePct: 55,
    students: 78,
    status: 'paused',
    createdAt: '2025-12-05',
  },
  {
    id: 'C-1003',
    title: 'Programming JS for Beginners',
    teacherName: 'Mohammad Hasan',
    price: 79,
    teacherSharePct: 65,
    students: 45,
    status: 'active',
    createdAt: '2026-02-01',
  },
];

function statusBadge(status: CourseStatus) {
  if (status === 'active') {
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
  }
  return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
}

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

type ModalMode = 'create' | 'edit';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all');

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [form, setForm] = useState<{
    title: string;
    teacherName: string;
    price: string;
    teacherSharePct: string;
    status: CourseStatus;
  }>({
    title: '',
    teacherName: '',
    price: '0',
    teacherSharePct: '60',
    status: 'active',
  });

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.status === 'active').length;
    const totalStudents = courses.reduce((acc, c) => acc + c.students, 0);
    const revenueMonthlyMock = courses
      .filter((c) => c.status === 'active')
      .reduce((acc, c) => acc + c.students * c.price, 0);

    return {
      total,
      active,
      totalStudents,
      revenueMonthlyMock,
    };
  }, [courses]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.teacherName.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [courses, q, statusFilter]);

  function resetForm() {
    setForm({
      title: '',
      teacherName: '',
      price: '0',
      teacherSharePct: '60',
      status: 'active',
    });
    setEditingId(null);
  }

  function openCreate() {
    setModalMode('create');
    resetForm();
    setOpenModal(true);
  }

  function openEdit(course: Course) {
    setModalMode('edit');
    setEditingId(course.id);
    setForm({
      title: course.title,
      teacherName: course.teacherName,
      price: String(course.price),
      teacherSharePct: String(course.teacherSharePct),
      status: course.status,
    });
    setOpenModal(true);
  }

  function saveCourse() {
    const title = form.title.trim();
    const teacherName = form.teacherName.trim();
    const price = Number(form.price || 0);
    const teacherSharePct = Number(form.teacherSharePct || 0);

    if (!title || !teacherName) return;
    if (Number.isNaN(price) || price < 0) return;
    if (Number.isNaN(teacherSharePct) || teacherSharePct < 0 || teacherSharePct > 100) return;

    if (modalMode === 'create') {
      const newCourse: Course = {
        id: `C-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        teacherName,
        price,
        teacherSharePct,
        students: 0,
        status: form.status,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setCourses((prev) => [newCourse, ...prev]);
    } else {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                title,
                teacherName,
                price,
                teacherSharePct,
                status: form.status,
              }
            : c
        )
      );
    }

    setOpenModal(false);
    resetForm();
  }

  function toggleStatus(id: string) {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
      )
    );
  }

  // computed preview: teacher share amount per sale
  const teacherShareAmountPreview = useMemo(() => {
    const price = Number(form.price || 0);
    const pct = Number(form.teacherSharePct || 0);
    const teacherAmount = Math.round((price * pct) / 100);
    const platformAmount = price - teacherAmount;
    return { teacherAmount, platformAmount };
  }, [form.price, form.teacherSharePct]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="w-7 h-7 text-blue-700 dark:text-blue-400" />
            Courses
          </h1>
          
        </div>

        {/* Add Course button (theme matched) */}
        <button
          onClick={openCreate}
          className="
            group inline-flex items-center gap-2
            px-4 py-2.5 rounded-xl
            bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            text-white font-semibold text-sm
            shadow-sm hover:shadow-md
            border border-blue-500/50
            transition-all duration-200
            active:scale-95
          "
        >
          <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          Add Course
        </button>
      </div>

      {/* Stats (same admin style, smaller) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Courses', value: stats.total.toLocaleString(), trend: '+3.1%', icon: Squares2X2Icon },
          { label: 'Active Courses', value: stats.active.toLocaleString(), trend: '+1.4%', icon: BookOpenIcon },
          { label: 'Total Students', value: stats.totalStudents.toLocaleString(), trend: '+6.2%', icon: UsersIcon },
          {
            label: 'Monthly Revenue',
            value: money(stats.revenueMonthlyMock),
            trend: '+9.8%',
            icon: CurrencyDollarIcon,
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
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {card.trend}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title / teacher / id..."
              className="w-full sm:w-96 pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Courses List <span className="text-gray-400 font-normal">({filtered.length})</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Teacher %</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{c.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{c.id}</span> • Created: {c.createdAt}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.teacherName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{money(c.price)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.teacherSharePct}%</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.students}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadge(
                        c.status
                      )}`}
                    >
                      {c.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => toggleStatus(c.id)}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                          c.status === 'active'
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                            : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                        }`}
                      >
                        {c.status === 'active' ? (
                          <>
                            <PauseCircleIcon className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <PlayCircleIcon className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No courses found. Try changing filters or add a new course.
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
          <div className="relative w-[94%] max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {modalMode === 'create' ? 'Add Course' : 'Edit Course'}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Course Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="e.g. English Basics A1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Teacher Name</label>
                  <input
                    value={form.teacherName}
                    onChange={(e) => setForm((p) => ({ ...p, teacherName: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="Teacher"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Price</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    type="number"
                    min={0}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Teacher share (%)</label>
                  <input
                    value={form.teacherSharePct}
                    onChange={(e) => setForm((p) => ({ ...p, teacherSharePct: e.target.value }))}
                    type="number"
                    min={0}
                    max={100}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                    placeholder="60"
                  />
                </div>
              </div>

              {/* Profit preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Profit split preview (per sale)
                </p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between bg-white/70 dark:bg-gray-900/40 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-gray-600 dark:text-gray-300">Teacher</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {money(teacherShareAmountPreview.teacherAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/70 dark:bg-gray-900/40 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-gray-600 dark:text-gray-300">Platform</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {money(teacherShareAmountPreview.platformAmount)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  (This is a preview only — connect it to your payments/reporting later.)
                </p>
              </div>
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
                onClick={saveCourse}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 transition-colors"
              >
                {modalMode === 'create' ? 'Create' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}