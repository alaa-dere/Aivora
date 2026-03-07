"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  PlusIcon,
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  UsersIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  PlayCircleIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export default function LiveSessionsPage() {
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    course: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    zoomLink: "",
    meetingId: "",
    password: "",
    reminder: "15",
    status: "scheduled",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sessions = [
    {
      id: 1,
      title: "Python OOP Review Session",
      course: "Advanced Python",
      courseCode: "CS401",
      date: "2024-02-10",
      time: "14:00 - 16:00",
      attendees: 32,
      totalStudents: 45,
      status: "scheduled",
      zoomLink: "https://zoom.us/j/123456789",
      recording: null,
      description: "Review of Object-Oriented Programming concepts, inheritance, polymorphism, and encapsulation",
    },
    // ... باقي الجلسات (أضيفيهم كامل إذا بدك، أنا حافظت على واحدة بس عشان الاختصار)
  ];

  const courses = [
    "Advanced Python",
    "Web Development",
    "Data Structures",
    "AI Fundamentals",
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            <ClockIcon className="w-4 h-4" />
            Scheduled
          </span>
        );
      case "live":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800 animate-pulse">
            <VideoCameraIcon className="w-4 h-4" />
            Live Now
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <CheckCircleIcon className="w-4 h-4" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (view === "upcoming") return session.status === "scheduled" || session.status === "live";
    if (view === "past") return session.status === "completed";
    return true;
  }).filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleSendReminder = () => {
    toast.success("Reminder sent successfully!");
  };

  const handleStartSession = () => {
    toast.success("Session started!");
  };

  const handleJoinSession = () => {
    toast.success("Joining session...");
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Session data:", formData);
    toast.success("Session scheduled successfully!");
    setShowScheduleModal(false);
    setFormData({
      title: "",
      course: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      zoomLink: "",
      meetingId: "",
      password: "",
      reminder: "15",
      status: "scheduled",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300 space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Live Sessions
          </h1>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
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
          Schedule Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Sessions", value: "24", trend: "+2 this week", icon: Squares2X2Icon },
          { label: "Upcoming", value: "8", trend: "+3", icon: ClockIcon },
          { label: "Total Attendees", value: "163", trend: "+15", icon: UsersIcon },
          { label: "Avg. Attendance", value: "78%", trend: "+4", icon: AcademicCapIcon },
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
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {card.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters + View Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
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
                bg-gray-50 dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            />
          </div>

          <div className="flex gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {["upcoming", "past", "all"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    view === v
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {v === "upcoming" ? "Upcoming" : v === "past" ? "Past" : "All"}
                </button>
              ))}
            </div>

            <button className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
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
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{session.title}</h3>
                  {getStatusBadge(session.status)}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {session.course} • {session.courseCode}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {session.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>
                      {session.status === "scheduled"
                        ? `${session.attendees}/${session.totalStudents} registered`
                        : `${session.attendees}/${session.totalStudents} attended`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <a
                      href={session.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 truncate max-w-[150px]"
                    >
                      Zoom Link
                    </a>
                  </div>
                </div>

                {session.status === "completed" && session.recording && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recording Available</span>
                      <a
                        href={session.recording}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                {session.status === "live" && (
                  <button
                    onClick={handleJoinSession}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <VideoCameraIcon className="w-4 h-4" />
                    Join Now
                  </button>
                )}

                {session.status === "scheduled" && (
                  <>
                    <button
                      onClick={handleStartSession}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <PlayCircleIcon className="w-4 h-4" />
                      Start Session
                    </button>
                    <button
                      onClick={handleSendReminder}
                      className="flex-1 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <EnvelopeIcon className="w-4 h-4" />
                      Reminder
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleCopyLink(session.zoomLink)}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <DocumentDuplicateIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: PlusIcon, title: "Schedule Session", desc: "Plan a new live class" },
            { icon: VideoCameraIcon, title: "Start Instant", desc: "Begin impromptu session" },
            { icon: UsersIcon, title: "Take Attendance", desc: "Mark attendance manually" },
            { icon: DocumentTextIcon, title: "Generate Report", desc: "Attendance analytics" },
          ].map((action, idx) => (
            <button
              key={idx}
              className="
                flex flex-col items-center text-center p-5
                bg-gray-50 dark:bg-gray-900/50
                rounded-xl border border-gray-200 dark:border-gray-700
                hover:bg-gray-100 dark:hover:bg-gray-800
                hover:border-blue-300 dark:hover:border-blue-700
                transition-all duration-200
              "
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                <action.icon className="w-6 h-6 text-blue-700 dark:text-blue-400" />
              </div>
              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                {action.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {action.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule New Session</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Session Details */}
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="e.g. Python OOP Review Session"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      placeholder="What will be covered in this session?"
                    />
                  </div>
                </div>
              </section>

              {/* Date & Time */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date & Time</h3>
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
                        className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                        className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Zoom / Meeting Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meeting Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zoom / Meeting Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.zoomLink}
                        onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
                        className="w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="https://zoom.us/j/123456789"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={formData.meetingId}
                      onChange={(e) => setFormData({ ...formData, meetingId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="123 456 7890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="abc123"
                    />
                  </div>
                </div>
              </section>

              {/* Reminder */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reminder Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send reminder
                  </label>
                  <select
                    value={formData.reminder}
                    onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="1440">1 day before</option>
                  </select>
                </div>
              </section>

              {/* Submit */}
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
                    hover:bg-gray-50 dark:hover:bg-gray-800
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

      <Toaster position="top-right" />
    </div>
  );
}