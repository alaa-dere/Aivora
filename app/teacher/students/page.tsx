"use client";

import { useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,       // بدل AlertTriangleIcon
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  ChartBarIcon,
  EyeIcon,
  PencilSquareIcon,             // بدل EditIcon
  EnvelopeIcon,                 // بدل MailIcon
  ArrowDownTrayIcon,            // بدل DownloadIcon
  ChatBubbleLeftRightIcon,      // بدل MessageSquareIcon
} from "@heroicons/react/24/outline";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showMessageModal, setShowMessageModal] = useState(false);

  const students = [
    {
      id: 1,
      name: "Ahmed Mohamed",
      email: "ahmed.m@student.com",
      avatar: "AM",
      course: "Advanced Python",
      courseCode: "CS401",
      progress: 85,
      averageScore: 92,
      status: "active",
      lastActive: "2 hours ago",
      attendance: 95,
      missingAssignments: 0,
    },
    {
      id: 2,
      name: "Sara Khaled",
      email: "sara.k@student.com",
      avatar: "SK",
      course: "Advanced Python",
      courseCode: "CS401",
      progress: 45,
      averageScore: 52,
      status: "at-risk",
      lastActive: "3 days ago",
      attendance: 60,
      missingAssignments: 3,
    },
    // أضيفي باقي الطلاب هنا إذا بدك، أنا حافظت على الاثنين بس عشان الاختصار
  ];

  const courses = [
    "All Courses",
    "Advanced Python",
    "Web Development",
    "Data Structures",
    "AI Fundamentals",
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === "all" || student.course === selectedCourse;
    const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    atRisk: students.filter((s) => s.status === "at-risk").length,
    inactive: students.filter((s) => s.status === "inactive").length || 0,
    avgProgress: Math.round(
      students.reduce((acc, s) => acc + s.progress, 0) / (students.length || 1)
    ),
    avgScore: Math.round(
      students.reduce((acc, s) => acc + s.averageScore, 0) / (students.length || 1)
    ),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
            <CheckCircleIcon className="w-4 h-4" />
            Active
          </span>
        );
      case "at-risk":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
            <ExclamationTriangleIcon className="w-4 h-4" />
            At Risk
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <XCircleIcon className="w-4 h-4" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const handleExportList = () => {
    const headers = ["Name", "Email", "Course", "Progress", "Avg Score", "Attendance", "Status", "Last Active"];
    const csvData = filteredStudents.map((s) => [
      s.name,
      s.email,
      s.course,
      `${s.progress}%`,
      `${s.averageScore}%`,
      `${s.attendance}%`,
      s.status,
      s.lastActive,
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("List exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300 space-y-6">
      {/* Header + Buttons */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Students
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportList}
            className="
              group inline-flex items-center gap-2
              px-4 py-2.5 rounded-xl
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              text-gray-700 dark:text-gray-300 font-medium text-sm
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-all duration-200
            "
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export List
          </button>

          <button
            onClick={() => setShowMessageModal(true)}
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
            <EnvelopeIcon className="w-5 h-5" />
            Send Message
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: stats.total.toString(), trend: "+12", icon: UsersIcon },
          { label: "Active Students", value: stats.active.toString(), trend: "+8", icon: BookOpenIcon },
          { label: "At Risk", value: stats.atRisk.toString(), trend: "+3", icon: ExclamationTriangleIcon},
          { label: "Avg. Progress", value: `${stats.avgProgress}%`, trend: "+6", icon: AcademicCapIcon },
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

      {/* At-Risk Alert */}
      {stats.atRisk > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
                At-Risk Students Alert
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {stats.atRisk}
                </span>
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                These students need immediate attention due to low performance and attendance.
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Avg Score: ~45%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Attendance: ~52%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Missing Assignments: ~4 avg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls: Search + Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-gray-50 dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="
                  px-3 py-2.5 rounded-lg
                  border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-gray-900
                  text-gray-800 dark:text-gray-100
                  outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
                "
              >
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="
                px-3 py-2.5 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-gray-50 dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="at-risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Student</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Course</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Score</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Last Active</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {student.avatar}
                      </div>
                      <div>
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {student.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {student.course}
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{student.courseCode}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.progress >= 70
                              ? "bg-emerald-500"
                              : student.progress >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {student.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        student.averageScore >= 85
                          ? "text-emerald-600 dark:text-emerald-400"
                          : student.averageScore >= 70
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {student.averageScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {student.attendance >= 75 ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          student.attendance >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {student.attendance}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(student.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {student.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/teacher/students/${student.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </Link>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <PencilSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <EnvelopeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions for At-Risk Students */}
      {stats.atRisk > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Quick Actions for At-Risk Students ({stats.atRisk})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: EnvelopeIcon, title: "Send Reminder", desc: "Notify all at-risk students" },
              { icon: UsersIcon, title: "Schedule Tutoring", desc: "Book extra help sessions" },
              { icon:  ArrowDownTrayIcon, title: "Generate Report", desc: "Detailed performance summary" },
              { icon: ChatBubbleLeftRightIcon, title: "Contact Parents", desc: "Send progress update" },
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
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Message to Students</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <XCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send To
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                  <option value="all">All Students ({students.length})</option>
                  <option value="at-risk">At-Risk Students ({stats.atRisk})</option>
                  <option value="active">Active Students ({stats.active})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter message subject"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="
                    px-6 py-3 rounded-xl
                    border border-gray-300 dark:border-gray-600
                    text-gray-700 dark:text-gray-300 font-medium
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition-all duration-200
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    toast.success("Message sent successfully to selected students!");
                  }}
                  className="
                    px-6 py-3 rounded-xl
                    bg-blue-950 hover:bg-blue-900
                    text-white font-medium
                    transition-all duration-200
                    active:scale-98
                  "
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}