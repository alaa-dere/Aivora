'use client';

import { useEffect, useMemo, useState } from 'react';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_START_HOUR = 13;
const CALENDAR_END_HOUR = 20;
const HOUR_ROW_HEIGHT = 64;

type AdminLiveSession = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'completed';
  teacherName: string;
  courseTitle: string;
  totalStudents: number;
};

export default function AdminLiveSessionsPage() {
  const [liveSessions, setLiveSessions] = useState<AdminLiveSession[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const loadLiveSessions = async () => {
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
    };
    loadLiveSessions();
  }, []);

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
        const durationMinutes = Math.max(30, Math.min(maxMinutes - topMinutes, endMinutes - startMinutes));
        return {
          ...session,
          dayIndex: start.getDay(),
          top: (topMinutes / 60) * HOUR_ROW_HEIGHT,
          height: Math.max(28, (durationMinutes / 60) * HOUR_ROW_HEIGHT),
        };
      })
      .filter(Boolean) as Array<
      AdminLiveSession & { dayIndex: number; top: number; height: number }
    >;
  }, [liveSessions, weekStart]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Live Sessions Schedule</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Central admin calendar for all instructor live sessions.
        </p>
      </div>

      <div className="admin-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 overflow-hidden">
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

            <div className="overflow-x-auto px-4 pb-2">
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
                          <div key={event.id} className="absolute left-1 right-1 rounded border border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-700 p-1.5" style={{ top: `${event.top}px`, height: `${event.height}px` }}>
                            <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200 truncate">{event.title}</p>
                            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 truncate">{event.teacherName}</p>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

