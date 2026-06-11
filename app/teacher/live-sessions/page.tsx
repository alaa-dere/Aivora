
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

type CourseOption = {
  id: string;
  name: string;
};

type SessionItem = {
  id: string;
  teacherId?: string;
  courseId: string;
  courseTitle: string;
  teacherName?: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  meetingLink: string | null;
  status: "scheduled" | "completed";
  attendees: number;
  totalStudents: number;
};

type AttendanceStudent = {
  id: string;
  name: string;
  status: string;
  attended: boolean;
  missedCount: number;
};

type DerivedSessionStatus = "scheduled" | "completed" | "past";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CALENDAR_START_HOUR = 13;
const CALENDAR_END_HOUR = 20;
const HOUR_ROW_HEIGHT = 72;

export default function LiveSessionsPage() {
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sharedSessions, setSharedSessions] = useState<SessionItem[]>([]);
  const [currentTeacherId, setCurrentTeacherId] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState<SessionItem | null>(null);
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [repeatCount, setRepeatCount] = useState(4);

  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingLink: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch("/api/teacher/courses", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      const list = (data.courses || []).map((c: any) => ({ id: c.id, name: c.name }));
      setCourses(list);
    } catch (error) {
      console.error("Failed to load courses", error);
    }
  };

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const [ownRes, sharedRes] = await Promise.all([
        fetch("/api/teacher/dashboard?liveSessions=1", { cache: "no-store" }),
        fetch("/api/teacher/dashboard?liveSessions=1&sharedSchedule=1", { cache: "no-store" }),
      ]);
      const ownData = await ownRes.json();
      const sharedData = await sharedRes.json();
      if (ownRes.ok) setSessions(ownData.sessions || []);
      if (sharedRes.ok) {
        setSharedSessions(sharedData.sessions || []);
        setCurrentTeacherId(String(sharedData.currentTeacherId || ""));
      }
    } catch (error) {
      console.error("Failed to load sessions", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    loadCourses();
    loadSessions();
  }, [mounted]);

  const formatDate = (value: string) => new Date(value).toLocaleDateString();
  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getDerivedStatus = (session: SessionItem): DerivedSessionStatus => {
    if (session.status === "completed") return "completed";
    const endAtMs = new Date(session.endAt).getTime();
    if (!Number.isNaN(endAtMs) && endAtMs < Date.now()) return "past";
    return "scheduled";
  };

  const filteredSessions = sessions
    .filter((session) => {
      const derivedStatus = getDerivedStatus(session);
      if (view === "upcoming") return derivedStatus === "scheduled";
      if (view === "past") return derivedStatus === "past" || derivedStatus === "completed";
      return true;
    })
    .filter((session) =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - day + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)),
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

  const filteredSharedSessions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sharedSessions;
    return sharedSessions.filter((session) =>
      [session.title, session.courseTitle, session.teacherName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [sharedSessions, searchTerm]);

  const calendarEvents = useMemo(() => {
    const weekStartMs = weekStart.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;
    const maxMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;

    return filteredSharedSessions
      .map((session) => {
        const start = new Date(session.startAt);
        const end = new Date(session.endAt);
        const startMs = start.getTime();
        if (Number.isNaN(startMs) || startMs < weekStartMs || startMs >= weekEndMs) return null;
        const dayIndex = start.getDay();
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        const minStart = CALENDAR_START_HOUR * 60;
        const topMinutes = Math.max(0, startMinutes - minStart);
        const snappedTopMinutes = Math.floor(topMinutes / 60) * 60;
        const rawDuration = Math.max(1, endMinutes - startMinutes);
        const snappedDurationMinutes = Math.max(60, Math.ceil(rawDuration / 60) * 60);
        const durationMinutes = Math.min(maxMinutes - snappedTopMinutes, snappedDurationMinutes);
        return {
          ...session,
          dayIndex,
          top: (snappedTopMinutes / 60) * HOUR_ROW_HEIGHT,
          height: Math.max(28, (durationMinutes / 60) * HOUR_ROW_HEIGHT),
        };
      })
      .filter(Boolean) as Array<
      SessionItem & { dayIndex: number; top: number; height: number }
    >;
  }, [filteredSharedSessions, weekStart]);

  const mobileWeekSessions = useMemo(() => {
    return weekDays.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const sessionsForDay = filteredSharedSessions
        .filter((session) => {
          const start = new Date(session.startAt);
          return start >= dayStart && start < dayEnd;
        })
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

      return { key: day.toISOString(), day, sessions: sessionsForDay };
    });
  }, [weekDays, filteredSharedSessions]);

  const weeklySchedule = useMemo(() => {
    const map: Record<number, SessionItem[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    sharedSessions.forEach((session) => {
      const status = getDerivedStatus(session);
      if (status !== "scheduled") return;
      const date = new Date(session.startAt);
      map[date.getDay()].push(session);
    });
    Object.values(map).forEach((daySessions) => {
      daySessions.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    });
    return map;
  }, [sharedSessions]);

  const handleCopyLink = (link: string | null) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleSendReminder = async (sessionId: string) => {
    try {
      const res = await fetch("/api/teacher/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notify_session", sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reminder");

      const notificationsSent = Number(data.notificationsSent || 0);
      const emailSent = Number(data.emailSent || 0);
      const emailFailed = Number(data.emailFailed || 0);
      const skippedReason = String(data.emailSkippedReason || "");
      const failureMessage = String(data.emailFailureMessage || "");

      if (notificationsSent === 0) {
        toast("No students found to notify.");
        return;
      }

      if (emailSent > 0 && emailFailed === 0) {
        toast.success(`Notified ${notificationsSent} students and sent ${emailSent} reminder emails.`);
        return;
      }

      if (emailSent > 0 && emailFailed > 0) {
        toast(`Notified ${notificationsSent}. Emails sent: ${emailSent}, failed: ${emailFailed}.`);
        return;
      }

      if (emailSent === 0) {
        const reasonMessage =
          skippedReason === "missing_sender"
            ? "EMAIL_FROM or EMAIL_USER is missing."
            : skippedReason === "missing_smtp"
              ? "SMTP/EMAIL settings are missing."
              : skippedReason === "send_failed"
                ? `Mail server rejected login/sending.${failureMessage ? ` (${failureMessage})` : ""}`
                : "Email delivery failed.";
        toast(`Notified ${notificationsSent} students in-app only. No emails sent: ${reasonMessage}`);
        return;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send reminder";
      toast.error(msg);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teacher/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_session",
          ...formData,
          repeatWeekly,
          repeatCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to schedule");
      }
      if (Array.isArray(data?.conflicts) && data.conflicts.length > 0) {
        toast(`Created ${data.sessionIds?.length || 0} session(s). Some weeks were skipped due to conflicts.`);
      } else {
        toast.success("Session scheduled successfully!");
      }
      setShowScheduleModal(false);
      setFormData({
        title: "",
        courseId: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        meetingLink: "",
      });
      await loadSessions();
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule");
    }
  };

  const openAttendance = async (session: SessionItem) => {
    try {
      setAttendanceOpen(true);
      setAttendanceSession(session);
      const res = await fetch(
        `/api/teacher/dashboard?liveSessions=1&sessionId=${encodeURIComponent(session.id)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attendance");
      setAttendanceStudents(data.students || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load attendance");
    }
  };

  const toggleAttendance = (studentId: string) => {
    if (attendanceSession?.status === "completed") return;
    setAttendanceStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attended: !s.attended } : s))
    );
  };

  const handleCompleteSession = async () => {
    if (!attendanceSession) return;
    try {
      setAttendanceSaving(true);
      const attendedStudentIds = attendanceStudents
        .filter((s) => s.attended)
        .map((s) => s.id);
      const res = await fetch("/api/teacher/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_session",
          sessionId: attendanceSession.id,
          attendedStudentIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to complete session");
      toast.success("Session completed and absentees notified!");
      setAttendanceOpen(false);
      setAttendanceSession(null);
      setAttendanceStudents([]);
      await loadSessions();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete session");
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/teacher/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_session", sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete session");
      toast.success("Session deleted");
      await loadSessions();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete session");
    }
  };

  const attendanceStats = useMemo(() => {
    const total = attendanceStudents.length;
    const attended = attendanceStudents.filter((s) => s.attended).length;
    return { total, attended };
  }, [attendanceStudents]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-3 sm:p-4 md:p-6 transition-colors duration-300 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Live Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Schedule weekly sessions, notify students, and track attendance.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="
            group w-full sm:w-auto inline-flex items-center justify-center gap-2
            px-3 py-2 text-xs rounded-lg
            sm:px-4 sm:py-2.5 sm:text-sm sm:rounded-xl
            bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            text-white font-semibold
            shadow-sm hover:shadow-md
            border border-blue-500/50
            transition-all duration-200
            active:scale-95
          "
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:rotate-90" />
          <span className="whitespace-nowrap">Schedule Weekly Session</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or course..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setDisplayMode("calendar")}
                className={`px-3 py-2 text-xs sm:text-sm whitespace-nowrap ${displayMode === "calendar" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setDisplayMode("list")}
                className={`px-3 py-2 text-xs sm:text-sm whitespace-nowrap ${displayMode === "list" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              >
                List
              </button>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {["upcoming", "past", "all"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as "upcoming" | "past" | "all")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    view === v
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
                  }`}
                >
                  {v === "upcoming" ? "Upcoming" : v === "past" ? "Past" : "All"}
                </button>
              ))}
            </div>

            <button className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition flex items-center gap-2 text-xs sm:text-sm">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loadingSessions ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading sessions...</div>
        ) : displayMode === "calendar" ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-[#f7f7f8] dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-700"
              >
                Today
              </button>
              <button onClick={() => setWeekOffset((v) => v - 1)} className="px-2 text-lg sm:text-xl leading-none text-gray-700 dark:text-gray-200">
                ‹
              </button>
              <button onClick={() => setWeekOffset((v) => v + 1)} className="px-2 text-lg sm:text-xl leading-none text-gray-700 dark:text-gray-200">
                ›
              </button>
              <p className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                {weekStart.toLocaleDateString([], { month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="md:hidden p-3 space-y-2">
              {mobileWeekSessions.map(({ key, day, sessions }) => (
                <div key={key} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-2.5">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {WEEKDAY_LABELS[day.getDay()]} {day.getDate()}
                  </p>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No sessions</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {sessions.map((session) => (
                        <button
                          key={`mobile-${session.id}`}
                          onClick={() => openAttendance(session)}
                          className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1.5"
                        >
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{session.title}</p>
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">{session.courseTitle}</p>
                          <p className="text-[11px] text-gray-600 dark:text-gray-300">
                            {formatTime(session.startAt)} - {formatTime(session.endAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, minmax(130px, 1fr))" }}>
                  <div className="border-r border-gray-200 dark:border-gray-700 bg-[#f7f7f8] dark:bg-gray-900" />
                  {weekDays.map((day) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={`header-${day.toISOString()}`}
                        className={`px-3 py-2 border-r border-gray-200 dark:border-gray-700 bg-[#f7f7f8] dark:bg-gray-900 ${isToday ? "border-t-2 border-t-indigo-500" : ""}`}
                      >
                        <p className={`text-4xl leading-none ${isToday ? "text-indigo-600 font-semibold" : "text-gray-700 dark:text-gray-200"}`}>
                          {day.getDate()}
                        </p>
                        <p className={`text-sm ${isToday ? "text-indigo-600 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                          {WEEKDAY_LABELS[day.getDay()]}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, minmax(130px, 1fr))" }}>
                  <div className="bg-[#f7f7f8] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                    {hourLabels.map((hour) => (
                      <div
                        key={`time-${hour}`}
                        className="text-xs text-gray-500 dark:text-gray-400 px-2 pt-1 border-b border-gray-200 dark:border-gray-700"
                        style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                      >
                        {new Date(2026, 0, 1, hour).toLocaleTimeString([], {
                          hour: "numeric",
                          hour12: true,
                        })}
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day) => (
                    <div
                      key={`col-${day.toISOString()}`}
                      className="relative border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
                      style={{ height: `${hourLabels.length * HOUR_ROW_HEIGHT}px` }}
                    >
                      {hourLabels.map((hour) => (
                        <div
                          key={`line-${day.toISOString()}-${hour}`}
                          className="border-b border-gray-200 dark:border-gray-700"
                          style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                        />
                      ))}
                      {calendarEvents
                        .filter((event) => event.dayIndex === day.getDay())
                        .map((event) => (
                          <div
                            key={event.id}
                            onClick={() => {
                              if (event.teacherId && currentTeacherId && event.teacherId !== currentTeacherId) return;
                              openAttendance(event);
                            }}
                            className="absolute left-1 right-1 rounded-md border border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-left shadow-sm hover:shadow cursor-pointer"
                            style={{ top: `${event.top}px`, height: `${event.height}px` }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (event.teacherId && currentTeacherId && event.teacherId !== currentTeacherId) return;
                                openAttendance(event);
                              }
                            }}
                          >
                            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {event.title}
                            </p>
                            <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate">
                              {event.teacherName || ""}
                            </p>
                            <p className="text-[10px] text-gray-600 dark:text-gray-300">
                              {formatTime(event.startAt)} - {formatTime(event.endAt)}
                            </p>
                            {event.meetingLink ? (
                              <Link
                                href={event.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                              >
                                <PlayCircleIcon className="h-3 w-3" />
                                Join Zoom
                              </Link>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          filteredSessions.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No sessions yet.</div>
          ) : (
          filteredSessions.map((session) => (
            (() => {
              const derivedStatus = getDerivedStatus(session);
              const isUpcoming = derivedStatus === "scheduled";
              const isCompleted = derivedStatus === "completed";
              const isPast = derivedStatus === "past";

              return (
            <div
              key={session.id}
              className="portal-surface 
                bg-white dark:bg-gray-800
                rounded-xl
                border border-blue-200 dark:border-blue-800
                shadow-sm
                p-5
                hover:-translate-y-1 hover:shadow-lg
                transition-all duration-200
              "
            >
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {session.title}
                    </h3>
                    {isUpcoming ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                        <ClockIcon className="w-4 h-4" />
                        Scheduled
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                        <ClockIcon className="w-4 h-4" />
                        Past
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <CheckCircleIcon className="w-4 h-4" />
                        Completed
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {session.courseTitle}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {session.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>{formatDate(session.startAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>
                        {formatTime(session.startAt)} - {formatTime(session.endAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>
                        {session.attendees}/{session.totalStudents} attended
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <button
                        onClick={() => handleCopyLink(session.meetingLink)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 truncate max-w-[150px]"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  {session.meetingLink ? (
                    <Link
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-md transition flex items-center justify-center gap-1.5 text-xs border border-emerald-200"
                    >
                      <PlayCircleIcon className="w-4 h-4" />
                      Join Zoom
                    </Link>
                  ) : null}
                  {isUpcoming && (
                    <button
                      onClick={() => handleSendReminder(session.id)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-md transition flex items-center justify-center gap-1.5 text-xs border border-blue-200"
                    >
                      <BellIcon className="w-4 h-4" />
                      Notify Students
                    </button>
                  )}

                  <button
                    onClick={() => openAttendance(session)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-md transition flex items-center justify-center gap-1.5 text-xs border border-blue-200"
                  >
                    <PlayCircleIcon className="w-4 h-4" />
                    {isCompleted ? "View Attendance" : "Take Attendance"}
                  </button>

                  <button
                    onClick={() => handleCopyLink(session.meetingLink)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 rounded-md transition"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4 text-blue-800" />
                  </button>

                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md transition"
                    title="Delete session"
                  >
                    <XCircleIcon className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
              );
            })()
          )))
        )}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
          <div className="portal-surface bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full my-6 sm:my-8 overflow-x-hidden">
            <div className="p-4 border-b border-blue-900 dark:border-gray-800 bg-blue-950 dark:bg-gray-950 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Schedule Weekly Session</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto overflow-x-hidden">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="e.g. Weekly Q&A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Repeat weekly
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={repeatWeekly}
                        onChange={(e) => setRepeatWeekly(e.target.checked)}
                        className="accent-blue-600"
                      />
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(Number(e.target.value || 1))}
                        className="portal-surface w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={!repeatWeekly}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">weeks</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      placeholder="What will be covered in this session?"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date & Time</h3>
                <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 p-3">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Weekly schedule snapshot (booked slots)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                    {WEEKDAY_LABELS.map((day, idx) => {
                      const daySessions = weeklySchedule[idx] || [];
                      return (
                        <div
                          key={day}
                          className={`rounded-lg border border-amber-100 dark:border-amber-800 p-2 overflow-hidden ${
                            daySessions.length === 0 ? "min-h-[60px]" : "min-h-[96px]"
                          }`}
                        >
                          <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">{day}</p>
                          {daySessions.length === 0 ? (
                            <p className="text-emerald-700 dark:text-emerald-300">Free</p>
                          ) : (
                            <div className="space-y-1 max-h-[92px] overflow-y-auto pr-1">
                              {daySessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="rounded-md bg-amber-100/70 dark:bg-amber-900/30 px-1.5 py-1"
                                  title={`${session.courseTitle} (${formatTime(session.startAt)} - ${formatTime(session.endAt)})`}
                                >
                                  <p className="text-amber-900 dark:text-amber-100 text-[10px] leading-tight truncate">
                                    {formatTime(session.startAt)} - {formatTime(session.endAt)}
                                  </p>
                                  <p className="text-amber-700 dark:text-amber-300 text-[10px] truncate">
                                    {session.courseTitle}
                                  </p>
                                  <p className="text-amber-700/90 dark:text-amber-300 text-[10px] truncate">
                                    {session.teacherName || "Teacher"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="portal-surface w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="portal-surface w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="portal-surface w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meeting Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meeting Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        className="portal-surface w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="https://zoom.us/j/123456789"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="
                    flex-1 flex items-center justify-center gap-2
                    py-3.5 px-6 rounded-xl
                    bg-blue-950 hover:bg-blue-900
                    text-white font-medium
                    shadow-md hover:shadow-lg
                    transition-all duration-200
                    active:scale-98
                  "
                >
                  <CheckIcon className="w-5 h-5" />
                  Schedule Session
                </button>

                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    py-3.5 px-6 rounded-xl
                    border border-gray-300 dark:border-gray-600
                    text-gray-700 dark:text-gray-300 font-medium
                    hover:bg-white dark:hover:bg-gray-800
                    transition-all duration-200
                  "
                >
                  <XMarkIcon className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {attendanceOpen && attendanceSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="portal-surface bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {attendanceSession.title} • {attendanceSession.courseTitle}
                </p>
              </div>
              <button
                onClick={() => {
                  setAttendanceOpen(false);
                  setAttendanceSession(null);
                  setAttendanceStudents([]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>
                  Attended: {attendanceStats.attended}/{attendanceStats.total}
                </span>
                <span className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                  6 missed sessions = failed course
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {attendanceStudents.map((student) => (
                  <div key={student.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Missed: {student.missedCount}/6
                        {student.status === "dropped" && " • Failed"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleAttendance(student.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        student.attended
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800"
                          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800"
                      } ${attendanceSession.status === "completed" ? "opacity-70 cursor-not-allowed" : ""}`}
                      disabled={attendanceSession.status === "completed"}
                    >
                      {student.attended ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : (
                        <XCircleIcon className="w-4 h-4" />
                      )}
                      {student.attended ? "Viewed" : "Not viewed"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
              {attendanceSession.status === "scheduled" ? (
                <button
                  onClick={handleCompleteSession}
                  disabled={attendanceSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
                >
                  <CheckIcon className="w-5 h-5" />
                  {attendanceSaving ? "Saving..." : "Complete & Notify Absents"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAttendanceOpen(false);
                    setAttendanceSession(null);
                    setAttendanceStudents([]);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}


