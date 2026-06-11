"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type CourseRow = {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft";
  students: number;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
  progress: number;
  status: string;
  completedAt?: string | null;
  bestQuizScore?: number;
  quizAttempts?: number;
  missedSessions?: number;
};

export default function StudentsPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentView, setStudentView] = useState<"active" | "completed">("active");
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch("/api/teacher/courses", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load courses");
        setCourses(data.courses || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedCourseId) return;
      try {
        setLoadingStudents(true);
        const res = await fetch(`/api/teacher/courses?courseId=${selectedCourseId}&view=${studentView}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load students");
        setStudents(data.students || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedCourseId, studentView]);

  const openDeleteModal = (student: StudentRow) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const removeCompletedStudent = async () => {
    if (!selectedCourseId || !studentToDelete) return;

    try {
      setDeletingStudentId(studentToDelete.id);
      const res = await fetch("/api/teacher/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, studentId: studentToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove student");
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove student");
    } finally {
      setDeletingStudentId(null);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.status === "active").length;
  const totalStudents = courses.reduce((sum, c) => sum + Number(c.students || 0), 0);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const avgProgress = filteredStudents.length
    ? Math.round(
        filteredStudents.reduce((sum, s) => sum + Number(s.progress || 0), 0) /
          filteredStudents.length
      )
    : 0;
  const completedCount = filteredStudents.filter((s) => s.status === "completed").length;
  const studentRiskAlerts = useMemo(() => {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    return filteredStudents
      .map((student) => {
        const avgProgress = Number(student.progress || 0);
        const avgQuizScore = Number(student.quizAttempts || 0) > 0 ? Number(student.bestQuizScore || 0) : 0;
        const maxMissedSessions = Number(student.missedSessions || 0);
        const progressPenalty = clamp((70 - avgProgress) * 0.7, 0, 35);
        const quizPenalty = clamp((75 - avgQuizScore) * 0.55, 0, 30);
        const attendancePenalty = clamp(maxMissedSessions * 10, 0, 35);
        const riskScore = Math.round(clamp(progressPenalty + quizPenalty + attendancePenalty, 0, 100));
        const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
        const riskReason =
          avgProgress < 65
            ? `Progress is ${Math.round(avgProgress)}%`
            : avgQuizScore < 70
              ? `Quiz average is ${Math.round(avgQuizScore)}%`
              : `Missed sessions: ${maxMissedSessions}`;

        return {
          studentId: student.id,
          fullName: student.name,
          email: student.email,
          avgProgress,
          avgQuizScore,
          maxMissedSessions,
          riskScore,
          riskLevel,
          riskReason,
          courses: selectedCourse?.name || "",
        };
      })
      .filter((student) => student.avgProgress < 65 || student.avgQuizScore < 70 || student.maxMissedSessions >= 3)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6);
  }, [filteredStudents, selectedCourse?.name]);

  const riskCounts = useMemo(
    () =>
      studentRiskAlerts.reduce(
        (counts, item) => {
          if (item.riskLevel === "high") counts.high += 1;
          else if (item.riskLevel === "medium") counts.medium += 1;
          else counts.low += 1;
          return counts;
        },
        { high: 0, medium: 0, low: 0 }
      ),
    [studentRiskAlerts]
  );

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Students
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedCourse
                ? studentView === "active"
                  ? `Students currently taking ${selectedCourse.name}`
                  : `Students who completed ${selectedCourse.name}`
                : "Choose a course to view students."}
            </p>
          </div>
        </div>

        {!selectedCourse && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Courses", value: totalCourses.toString(), icon: BookOpenIcon },
                { label: "Active Courses", value: activeCourses.toString(), icon: AcademicCapIcon },
                { label: "Total Students", value: totalStudents.toString(), icon: UsersIcon },
              ].map((card) => (
                <div
                  key={card.label}
                  className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <card.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {loadingCourses ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No courses found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setError(null);
                      setSelectedCourseId(course.id);
                      setStudentView("active");
                    }}
                    className="admin-surface relative overflow-hidden text-left bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <BookOpenIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {course.name}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          course.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800"
                        }`}
                      >
                        {course.status === "active" ? "Active" : "Draft"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {course.description || "No description yet."}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {course.students}
                        </p>
                      </div>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        View Students
                        <ChevronRightIcon className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedCourse && (
          <div className="space-y-4">
            <div className="admin-surface relative overflow-hidden self-start h-fit bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BookOpenIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {selectedCourse.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      selectedCourse.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800"
                    }`}
                  >
                    {selectedCourse.status === "active" ? "Active" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {selectedCourse.description || "No description yet."}
                </p>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {filteredStudents.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{avgProgress}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Progress</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {completedCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  </div>
                </div>
            </div>

            <div className="admin-surface relative overflow-hidden self-start h-fit bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-3.5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Student Risk Alert</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Students who need support now</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 px-2 py-1">High {riskCounts.high}</span>
                    <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1">Med {riskCounts.medium}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1">Low {riskCounts.low}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                  {studentRiskAlerts.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 xl:col-span-2">No high-risk students detected in the current data window.</p>
                  ) : (
                    studentRiskAlerts.map((student) => {
                      const tone =
                        student.riskLevel === "high"
                          ? "border-sky-200 bg-sky-50/90 dark:border-sky-900/60 dark:bg-sky-900/20"
                          : student.riskLevel === "medium"
                            ? "border-blue-200 bg-blue-50/90 dark:border-blue-900/60 dark:bg-blue-900/20"
                            : "border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/60 dark:bg-emerald-900/20";
                      const badge =
                        student.riskLevel === "high"
                          ? "text-sky-700 dark:text-sky-300"
                          : student.riskLevel === "medium"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-emerald-700 dark:text-emerald-300";

                      const riskBar =
                        student.riskLevel === "high"
                          ? "from-sky-500 via-blue-500 to-indigo-500"
                          : student.riskLevel === "medium"
                            ? "from-blue-500 via-cyan-500 to-teal-400"
                            : "from-emerald-500 via-teal-500 to-cyan-400";

                      return (
                        <div
                          key={student.studentId}
                          className={`relative overflow-hidden rounded-xl border p-2.5 sm:p-3 shadow-sm hover:shadow transition-all duration-200 ${tone}`}
                        >
                          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${riskBar}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">{student.fullName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-950/30 ${badge}`}>
                              {student.riskLevel.toUpperCase()} RISK
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <div className="rounded-md bg-white/70 dark:bg-slate-950/25 p-1.5">
                              <p className="text-slate-400 dark:text-slate-500">Progress</p>
                              <p className="font-semibold">{Math.round(student.avgProgress)}%</p>
                            </div>
                            <div className="rounded-md bg-white/70 dark:bg-slate-950/25 p-1.5">
                              <p className="text-slate-400 dark:text-slate-500">Quiz avg</p>
                              <p className="font-semibold">{Math.round(student.avgQuizScore)}%</p>
                            </div>
                            <div className="rounded-md bg-white/70 dark:bg-slate-950/25 p-1.5">
                              <p className="text-slate-400 dark:text-slate-500">Missed</p>
                              <p className="font-semibold">{student.maxMissedSessions}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between">
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">Risk score</p>
                              <p className={`text-[11px] font-semibold ${badge}`}>{student.riskScore}%</p>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/70 dark:bg-slate-950/30 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${riskBar}`}
                                style={{ width: `${Math.max(6, Math.min(100, student.riskScore))}%` }}
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{student.riskReason}</p>
                          {student.courses ? (
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{student.courses}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
            </div>

            <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setStudentView("active")}
                    className={`px-3 py-2 text-xs font-semibold ${
                      studentView === "active"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Active Students
                  </button>
                  <button
                    onClick={() => setStudentView("completed")}
                    className={`px-3 py-2 text-xs font-semibold border-l border-slate-200 dark:border-slate-700 ${
                      studentView === "completed"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Completed Students
                  </button>
                </div>
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name / email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                  />
                </div>
              </div>
            </div>

            <div className="admin-surface bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
              {loadingStudents ? (
                <div className="p-5 text-sm text-gray-500 dark:text-gray-400">Loading students...</div>
              ) : error ? (
                <div className="p-5 text-sm text-red-500">{error}</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-5 text-sm text-gray-500 dark:text-gray-400">
                  {studentView === "active"
                    ? "No active students currently taking this course."
                    : "No completed students in this course yet."}
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {studentView === "active" ? "Active Students" : "Completed Students"}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                      {filteredStudents.length} students
                    </span>
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-medium">Student</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Progress</th>
                          <th className="px-4 py-3 font-medium">Quiz Score</th>
                          <th className="px-4 py-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {student.imageUrl ? (
                                  <img
                                    src={student.imageUrl}
                                    alt={student.name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-bold">
                                    {student.name
                                      .split(" ")
                                      .map((part) => part[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                )}
                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                  {student.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{student.email}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full ${
                                  student.status === "completed"
                                    ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                                    : student.status === "dropped"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {(student.status || "in progress").replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      student.progress >= 70
                                        ? "bg-blue-400"
                                        : student.progress >= 40
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${student.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {student.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                              {Number(student.quizAttempts || 0) > 0
                                ? `${Math.round(Number(student.bestQuizScore || 0))}%`
                                : "No attempts"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {studentView === "completed" ? (
                                <button
                                  onClick={() => openDeleteModal(student)}
                                  disabled={deletingStudentId === student.id}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-60"
                                >
                                  {deletingStudentId === student.id ? "Deleting..." : "Delete"}
                                </button>
                              ) : (
                                <Link
                                  href={`/teacher/students/${student.id}`}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                >
                                  View Student
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden p-2.5 space-y-2.5">
                    {filteredStudents.map((student) => (
                      <div
                        key={`mobile-${student.id}`}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {student.email}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              student.status === "completed"
                                ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                                : student.status === "dropped"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {(student.status || "in progress").replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="text-slate-500 dark:text-slate-400">Progress</div>
                          <div className="text-right text-slate-700 dark:text-slate-300">{student.progress}%</div>
                          <div className="text-slate-500 dark:text-slate-400">Quiz Score</div>
                          <div className="text-right text-slate-700 dark:text-slate-300">
                            {Number(student.quizAttempts || 0) > 0
                              ? `${Math.round(Number(student.bestQuizScore || 0))}%`
                              : "No attempts"}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.progress >= 70
                                  ? "bg-blue-400"
                                  : student.progress >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          {studentView === "completed" ? (
                            <button
                              onClick={() => openDeleteModal(student)}
                              disabled={deletingStudentId === student.id}
                              className="text-[11px] px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-60"
                            >
                              {deletingStudentId === student.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : (
                            <Link
                              href={`/teacher/students/${student.id}`}
                              className="text-[11px] px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            >
                              View Student
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isDeleteModalOpen && studentToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirm Delete</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Delete completed student <strong>{studentToDelete.name}</strong> from this course list?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (deletingStudentId) return;
                  setIsDeleteModalOpen(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={removeCompletedStudent}
                disabled={deletingStudentId === studentToDelete.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingStudentId === studentToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
