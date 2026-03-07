'use client';

import { useMemo, useState, useEffect } from 'react'; // أضف useEffect
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

type CourseStatus = 'active' | 'paused' | 'draft';

type Course = {
  id: string;
  title: string;
  description?: string;
  teacherName: string;
  teacherId: string;
  price: number;
  teacherSharePct: number;
  students: number;
  status: CourseStatus;
  createdAt: string;
};

// ... باقي الأنواع

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all');

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    title: string;
    description: string;
    teacherId: string;
    price: string;
    teacherSharePct: string;
    status: CourseStatus;
  }>({
    title: '',
    description: '',
    teacherId: '',
    price: '0',
    teacherSharePct: '60',
    status: 'draft',
  });

  // جلب الكورسات من API
  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers/list');
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.status === 'active').length;
    const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0);
    const revenueMonthlyMock = courses
      .filter((c) => c.status === 'active')
      .reduce((acc, c) => acc + (c.students || 0) * c.price, 0);

    return { total, active, totalStudents, revenueMonthlyMock };
  }, [courses]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.teacherName?.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [courses, q, statusFilter]);

  function resetForm() {
    setForm({
      title: '',
      description: '',
      teacherId: '',
      price: '0',
      teacherSharePct: '60',
      status: 'draft',
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
      description: course.description || '',
      teacherId: course.teacherId,
      price: String(course.price),
      teacherSharePct: String(course.teacherSharePct || 60),
      status: course.status,
    });
    setOpenModal(true);
  }

async function saveCourse() {
  const title = form.title.trim();
  const description = form.description.trim();
  const teacherId = form.teacherId;
  const price = Number(form.price || 0);

  if (!title || !description || !teacherId) return;

  // تحويل status للقيم المتوقعة
  let dbStatus = 'draft';
  if (form.status === 'active') dbStatus = 'published';
  else if (form.status === 'paused') dbStatus = 'archived';
  else dbStatus = 'draft';

  try {
    if (modalMode === 'create') {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          teacherId,
          price,
          teacherSharePct: Number(form.teacherSharePct),
          status: dbStatus,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchCourses();
        setOpenModal(false);
        resetForm();
      } else {
        console.error('Error response:', data);
      }
    }
  } catch (error) {
    console.error('Error saving course:', error);
  }
}

  async function toggleStatus(id: string) {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: course.status === 'active' ? 'paused' : 'active',
        }),
      });

      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  }

  // باقي الكود (JSX) مع بعض التعديلات
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
           All Courses
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
          Add New Course
        </button>
      </div>

      {/* Stats Cards - نفس الشيء */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Courses', value: stats.total.toString(), trend: '+3.1%', icon: Squares2X2Icon },
          { label: 'Active Courses', value: stats.active.toString(), trend: '+1.4%', icon: BookOpenIcon },
          { label: 'Total Students', value: stats.totalStudents.toString(), trend: '+6.2%', icon: UsersIcon },
          {
            label: 'Monthly Revenue',
            value: `$${stats.revenueMonthlyMock}`,
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

      {/* Search & Filter */}
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
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No courses found. Try changing filters or add a new course.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{c.title}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {c.id.slice(0, 8)}... • {c.createdAt}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.teacherName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">${c.price}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.teacherSharePct || 60}%</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.students || 0}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${
                          c.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'
                            : c.status === 'paused'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                            : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : c.status === 'paused' ? 'Paused' : 'Draft'}
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
                              {c.status === 'paused' ? 'Activate' : 'Publish'}
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
          <div className="relative w-full max-w-xl lg:max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-900/40 dark:border-gray-700 overflow-hidden">
            
            {/* Header */}
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
            <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div>
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
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                    placeholder="Course description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teacher
                  </label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                  >
                    <option value="">Select teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price ($)
                    </label>
                    <input
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      type="number"
                      min={0}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
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
                    />
                  </div>
                </div>

                {/* Profit preview section */}
                {Number(form.price) > 0 && Number(form.teacherSharePct) > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-5 mt-6">
                    <p className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Profit split preview (per sale)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between bg-white/70 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                        <span className="text-gray-600 dark:text-gray-300">Teacher</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${((Number(form.price) * Number(form.teacherSharePct)) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white/70 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                        <span className="text-gray-600 dark:text-gray-300">Platform</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${(Number(form.price) - (Number(form.price) * Number(form.teacherSharePct)) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all text-base"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
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