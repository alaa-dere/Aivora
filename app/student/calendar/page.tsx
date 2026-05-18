'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type SessionItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  startAt: string | null;
  endAt: string | null;
  meetingLink: string | null;
  status: string;
  source: 'session';
};

type ReminderItem = {
  id: string;
  courseId: string | null;
  title: string;
  message: string;
  eventAt: string | null;
  createdAt: string | null;
  source: 'notification';
};

type DeliverableItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  detail: string;
  bestScore: number;
  unlockedAt: string | null;
  status: 'pending';
};

type AbsenceItem = {
  courseId: string;
  courseTitle: string;
  missedCount: number;
};

type CalendarResponse = {
  summary: {
    totalSessions: number;
    totalReminders: number;
    totalDeliverables: number;
    totalAbsences: number;
  };
  sessions: SessionItem[];
  reminders: ReminderItem[];
  deliverables: DeliverableItem[];
  absences: AbsenceItem[];
  courseStats: {
    courseId: string;
    courseTitle: string;
    totalLectures: number;
    completedLectures: number;
    upcomingLectures: number;
    missedCount: number;
  }[];
};

type CalendarEvent = {
  id: string;
  kind: 'session' | 'reminder' | 'deliverable';
  title: string;
  courseTitle: string;
  startsAt: string;
  meta: string;
  meetingLink?: string | null;
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StudentCalendarPage() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => dateKey(new Date()));

  useEffect(() => {
    let mounted = true;
    const loadCalendar = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/student/calendar', { cache: 'no-store' });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message || 'Failed to load calendar');
        if (mounted) setData(payload);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load calendar');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCalendar();
    return () => {
      mounted = false;
    };
  }, []);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!data) return [];
    const sessionEvents = data.sessions
      .filter((s) => Boolean(s.startAt))
      .map((s) => ({
        id: `session-${s.id}`,
        kind: 'session' as const,
        title: s.title || 'Live Session',
        courseTitle: s.courseTitle,
        startsAt: s.startAt as string,
        meta: `${formatTime(s.startAt as string)} • ${s.status}`,
        meetingLink: s.meetingLink,
      }));

    const reminderEvents = data.reminders
      .filter((r) => Boolean(r.eventAt))
      .map((r) => ({
        id: `reminder-${r.id}`,
        kind: 'reminder' as const,
        title: r.title || 'Live Session Reminder',
        courseTitle: r.courseId ? 'Course Session' : 'Reminder',
        startsAt: r.eventAt as string,
        meta: formatTime(r.eventAt as string),
      }));

    const deliverableEvents = data.deliverables
      .map((d) => {
        const startsAt = d.unlockedAt || new Date().toISOString();
        return {
          id: `deliverable-${d.id}`,
          kind: 'deliverable' as const,
          title: d.title,
          courseTitle: d.courseTitle,
          startsAt,
          meta: `Best score: ${d.bestScore}%`,
        };
      });

    return [...sessionEvents, ...reminderEvents, ...deliverableEvents];
  }, [data]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.startsAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const monthGrid = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [monthAnchor]);

  const selectedEvents = eventsByDay.get(selectedKey) || [];
  const courseStats = data?.courseStats || [];

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="portal-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Student Calendar</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          View live sessions, reminders, pending submissions, and your absence count.
        </p>
      </div>

      {loading ? (
        <div className="portal-surface rounded-2xl p-8 text-sm text-gray-500 dark:text-gray-400">Loading calendar...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 portal-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 border-b border-blue-900/60 dark:border-gray-800 flex items-center justify-between bg-blue-950/95 dark:bg-gray-950/90">
                <button
                  onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}
                  className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-white" />
                </button>
                <p className="text-sm sm:text-base font-semibold text-white text-center">
                  {monthAnchor.toLocaleString([], { month: 'long', year: 'numeric' })}
                </p>
                <button
                  onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}
                  className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRightIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-7 text-xs font-semibold text-center border-b border-slate-200 dark:border-slate-800">
                    {days.map((d) => (
                      <div key={d} className="py-2 text-slate-500 dark:text-slate-400">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {monthGrid.map((d) => {
                      const key = dateKey(d);
                      const isCurrentMonth = d.getMonth() === monthAnchor.getMonth();
                      const isSelected = key === selectedKey;
                      const dayEvents = eventsByDay.get(key) || [];
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedKey(key)}
                          className={`h-20 sm:h-24 border border-slate-100 dark:border-slate-800 p-1.5 text-left align-top transition-colors ${
                            isSelected ? 'bg-sky-100/80 dark:bg-sky-900/25 ring-1 ring-sky-300/70 dark:ring-sky-700/60' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                          }`}
                        >
                          <p className={`text-xs ${isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                            {d.getDate()}
                          </p>
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 1).map((event) => (
                              <div
                                key={event.id}
                                className={`rounded px-1 py-0.5 text-[10px] truncate ${
                                  event.kind === 'session'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : event.kind === 'deliverable'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                }`}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 1 && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">+{dayEvents.length - 1} more</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="portal-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Events for {selectedKey}
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No events for this day.</p>
                  ) : (
                    selectedEvents
                      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                      .map((event) => (
                        <div key={event.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{event.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.courseTitle}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{event.meta}</p>
                          {event.meetingLink ? (
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 mt-2 hover:underline"
                            >
                              <ClockIcon className="w-3.5 h-3.5" />
                              Join meeting
                            </a>
                          ) : null}
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="portal-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-red-400" />
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Per-Course Lectures & Absences</p>
                </div>
                <div className="p-3 space-y-2">
                  {courseStats.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No course stats yet.</p>
                  ) : (
                    courseStats.map((row) => (
                      <div key={row.courseId} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{row.courseTitle}</p>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Lectures: {row.completedLectures}/{row.totalLectures} done</span>
                          <span>Upcoming: {row.upcomingLectures}</span>
                        </div>
                        <div className="mt-1 text-xs">
                          <span className={row.missedCount >= 5 ? 'text-red-600 dark:text-red-300 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
                            Absences: {row.missedCount}/6
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
