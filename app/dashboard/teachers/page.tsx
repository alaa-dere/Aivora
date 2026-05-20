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

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_START_HOUR = 13;
const CALENDAR_END_HOUR = 20;
const HOUR_ROW_HEIGHT = 64;

type Status = 'active' | 'inactive';

type TeacherRow = {
  id: string;
  fullName: string;
  email: string;
  status: Status;
  createdAt: string;
};

type AdminLiveSession = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  meetingLink: string | null;
  status: 'scheduled' | 'completed';
  teacherName: string;
  courseTitle: string;
  totalStudents: number;
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
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
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherRow | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [liveSessions, setLiveSessions] = useState<AdminLiveSession[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch('/api/teachers');
        const data = await res.json();
        if (res.ok) {
          setTeachers(data.teachers || []);
        }
      } catch (err) {
        console.error('Failed to load teachers', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  useEffect(() => {
    async function fetchLiveSessions() {
      try {
        setLiveLoading(true);
        setLiveError('');
        const res = await fetch('/api/admin/live-sessions', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load live sessions');
        setLiveSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch (err: unknown) {
        setLiveError(err instanceof Error ? err.message : 'Failed to load live sessions');
      } finally {
        setLiveLoading(false);
      }
    }
    fetchLiveSessions();
  }, []);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesQuery =
        !searchQuery ||
        teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [teachers, searchQuery, statusFilter]);

  const filteredCount = filteredTeachers.length;
  const weekStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const weekDays = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
      ),
    [weekStart]
  );

  const hourLabels = useMemo(
    () =>
      Array.from(
        { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
        (_, idx) => CALENDAR_START_HOUR + idx
      ),
    []
  );

  const calendarEvents = useMemo(() => {
    const weekStartMs = weekStart.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;
    const minStart = CALENDAR_START_HOUR * 60;
    const maxMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
    return liveSessions
      .map((session) => {
        const start = new Date(session.startAt);
        const end = new Date(session.endAt);
        const startMs = start.getTime();
        if (Number.isNaN(startMs) || startMs < weekStartMs || startMs >= weekEndMs) return null;
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        const topMinutes = Math.max(0, startMinutes - minStart);
        const snappedTopMinutes = Math.floor(topMinutes / 60) * 60;
        const rawDuration = Math.max(1, endMinutes - startMinutes);
        const snappedDurationMinutes = Math.max(60, Math.ceil(rawDuration / 60) * 60);
        const durationMinutes = Math.min(maxMinutes - snappedTopMinutes, snappedDurationMinutes);
        return {
          ...session,
          dayIndex: start.getDay(),
          top: (snappedTopMinutes / 60) * HOUR_ROW_HEIGHT,
          height: Math.max(28, (durationMinutes / 60) * HOUR_ROW_HEIGHT),
        };
      })
      .filter(Boolean) as Array<
      AdminLiveSession & { dayIndex: number; top: number; height: number }
    >;
  }, [liveSessions, weekStart]);

  // Open modal for Add
  function openAddModal() {
    setModalMode('add');
    setFormData({ id: '', fullName: '', email: '', password: '', status: 'active' });
    setModalError('');
    setIsAddEditModalOpen(true);
  }

  // Open modal for Edit
  function openEditModal(teacher: TeacherRow) {
    setModalMode('edit');
    setFormData({
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      password: '',
      status: teacher.status,
    });
    setModalError('');
    setIsAddEditModalOpen(true);
  }

  // Open delete modal
  function openDeleteModal(teacher: TeacherRow) {
    setTeacherToDelete(teacher);
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
      setModalError('Password is required for new teacher');
      return;
    }

    try {
      let res;

      if (modalMode === 'add') {
        res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch('/api/teachers', {
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
        setModalError(data.message || `Failed to ${modalMode === 'add' ? 'add' : 'update'} teacher`);
        return;
      }

      if (modalMode === 'add') {
        setTeachers((prev) => [data.teacher, ...prev]);
      } else {
        setTeachers((prev) =>
          prev.map((t) => (t.id === formData.id ? data.teacher : t))
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
    if (!teacherToDelete) return;

    try {
      const res = await fetch('/api/teachers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teacherToDelete.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(
          data.message || 'Failed to delete teacher. Please reassign any courses and try again.'
        );
        return;
      }

      setTeachers((prev) => prev.filter((t) => t.id !== teacherToDelete.id));

      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
      setDeleteError('');
    } catch (err) {
      setDeleteError('Server connection error. Please try again.');
    }
  }

  function openMeetingLink(link: string | null) {
    if (!link) {
      alert('No meeting link is set for this session yet.');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">All Teachers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage teacher accounts, status, and access.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1 max-w-2xl">
            <button
              onClick={openAddModal}
              className="
                group inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl
                bg-emerald-600 hover:bg-emerald-700
                text-white font-semibold text-sm
                shadow-sm border border-emerald-500/60
                transition-all duration-200 active:scale-95
                whitespace-nowrap
              "
            >
              <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
              Add New Teacher
            </button>
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name / email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
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
        <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Teachers List <span className="text-gray-400 font-normal">({filteredCount})</span>
          </p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white dark:bg-slate-900/60">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Registration Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No teachers found. Try changing filters or add a new teacher.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {teacher.fullName}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {teacher.email}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          teacher.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                        }`}
                      >
                        {teacher.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {new Date(teacher.createdAt).toLocaleDateString('en-US')}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/teachers/${teacher.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </Link>

                        <button
                          onClick={() => openEditModal(teacher)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => openDeleteModal(teacher)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
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
          ) : filteredTeachers.length === 0 ? (
            <div className="px-3 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              No teachers found. Try changing filters or add a new teacher.
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <div
                key={`mobile-${teacher.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{teacher.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{teacher.email}</p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border ${
                      teacher.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                    }`}
                  >
                    {teacher.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(teacher.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/dashboard/teachers/${teacher.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </Link>

                  <button
                    onClick={() => openEditModal(teacher)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => openDeleteModal(teacher)}
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

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Sessions Calendar</p>
        </div>
        {liveLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading live sessions...</div>
        ) : liveError ? (
          <div className="p-6 text-sm text-red-500">{liveError}</div>
        ) : liveSessions.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No scheduled live sessions.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 pt-3">
              <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700">Today</button>
              <button onClick={() => setWeekOffset((v) => v - 1)} className="px-2 text-lg">{'<'}</button>
              <button onClick={() => setWeekOffset((v) => v + 1)} className="px-2 text-lg">{'>'}</button>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {weekStart.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="overflow-x-auto px-4 pb-4">
              <div className="min-w-[980px]">
                <div className="grid" style={{ gridTemplateColumns: '58px repeat(7, minmax(130px, 1fr))' }}>
                  <div className="border-r border-slate-200 dark:border-slate-800" />
                  {weekDays.map((day) => (
                    <div key={`head-${day.toISOString()}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{day.getDate()}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{WEEKDAY_LABELS[day.getDay()]}</p>
                    </div>
                  ))}
                </div>
                <div className="grid" style={{ gridTemplateColumns: '58px repeat(7, minmax(130px, 1fr))' }}>
                  <div className="border-r border-slate-200 dark:border-slate-800">
                    {hourLabels.map((hour) => (
                      <div key={`hour-${hour}`} className="px-1 pt-1 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800" style={{ height: `${HOUR_ROW_HEIGHT}px` }}>
                        {new Date(2026, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                      </div>
                    ))}
                  </div>
                  {weekDays.map((day) => (
                    <div key={`col-${day.toISOString()}`} className="relative border-r border-slate-200 dark:border-slate-800" style={{ height: `${hourLabels.length * HOUR_ROW_HEIGHT}px` }}>
                      {hourLabels.map((hour) => (
                        <div key={`line-${day.toISOString()}-${hour}`} className="border-b border-slate-200 dark:border-slate-800" style={{ height: `${HOUR_ROW_HEIGHT}px` }} />
                      ))}
                      {calendarEvents
                        .filter((event) => event.dayIndex === day.getDay())
                        .map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => openMeetingLink(event.meetingLink)}
                            title={event.meetingLink ? 'Open meeting link' : 'No meeting link'}
                            className="absolute left-1 right-1 rounded border border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-700 p-1.5 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                            style={{ top: `${event.top}px`, height: `${event.height}px` }}
                          >
                            <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200 truncate">{event.title}</p>
                            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 truncate">{event.teacherName}</p>
                            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 truncate">
                              {event.meetingLink ? 'Click to open meeting' : 'No link yet'}
                            </p>
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
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
                  placeholder="Teacher name"
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
                  placeholder="teacher@example.com"
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
                  {modalMode === 'add' ? 'Add Teacher' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && teacherToDelete && (
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
                Are you sure you want to delete <strong>{teacherToDelete.fullName}</strong>?
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
                  Delete Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
