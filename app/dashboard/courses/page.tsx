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
  XMarkIcon,
} from '@heroicons/react/24/outline';

type CourseStatus = 'active' | 'paused';

type Course = {
  id: string;
  title: string;
  teacherName: string;
  price: number;
  teacherSharePct: number;
  students: number;
  status: CourseStatus;
  createdAt: string;
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

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

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

    return { total, active, totalStudents, revenueMonthlyMock };
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
            ? { ...c, title, teacherName, price, teacherSharePct, status: form.status }
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
            Courses
          </h1>
        </div>

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

      {/* Stats */}
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
              p-5
              hover:-translate-y-1 hover:shadow-lg
              transition-all duration-200
            "
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>

              <span
                className="
                  text-xs font-medium px-2 py-1 rounded-full
                  bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300
                "
              >
                {card.trend}
              </span>
            </div>

            <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title / teacher / id..."
              className="w-full sm:w-96 pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
          <div className="relative w-full max-w-xl lg:max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-900/40 dark:border-gray-700 overflow-hidden">
            
            {/* Header - نفس لون topbar */}
            <div className="px-6 py-1 md:py-2 bg-blue-950 border-b border-blue-900 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {modalMode === 'create' ? 'Add Course' : 'Edit Course'}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="p-2.5 rounded-full hover:bg-blue-900/70 text-white/90 hover:text-white transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                    placeholder="e.g. English Basics A1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teacher Name
                  </label>
                  <input
                    value={form.teacherName}
                    onChange={(e) => setForm((p) => ({ ...p, teacherName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                    placeholder="Teacher"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    type="number"
                    min={0}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teacher Share (%)
                  </label>
                  <input
                    value={form.teacherSharePct}
                    onChange={(e) => setForm((p) => ({ ...p, teacherSharePct: e.target.value }))}
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                    placeholder="60"
                  />
                </div>
              </div>

              {/* Profit preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-5 mt-6">
                <p className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Profit split preview (per sale)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between bg-white/70 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-gray-600 dark:text-gray-300">Teacher</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {money(teacherShareAmountPreview.teacherAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/70 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-gray-600 dark:text-gray-300">Platform</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {money(teacherShareAmountPreview.platformAmount)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  (This is a preview only — connect it to your payments/reporting later.)
                </p>
              </div>
            </div>

            {/* Footer - أصغر حجم + لون Save نفس الهيدر */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50/80 dark:bg-gray-950/50">
              <button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
                className="
                  min-w-[90px] px-5 py-2 
                  text-sm font-medium 
                  rounded-lg 
                  border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 
                  text-gray-700 dark:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-gray-700 
                  hover:border-gray-400 dark:hover:border-gray-500 
                  transition-colors
                "
              >
                Cancel
              </button>

              <button
                onClick={saveCourse}
                className="
                  min-w-[110px] px-6 py-2 
                  text-sm font-medium 
                  rounded-lg 
                  bg-blue-950 hover:bg-blue-900 
                  text-white 
                  transition-all active:scale-95
                "
              >
                {modalMode === 'create' ? 'Add Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}