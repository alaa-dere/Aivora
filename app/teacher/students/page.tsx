"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  AcademicCapIcon,
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
};

export default function StudentsPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
        const res = await fetch(`/api/teacher/courses?courseId=${selectedCourseId}`, {
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
  }, [selectedCourseId]);

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
  const atRiskCount = filteredStudents.filter((s) => Number(s.progress || 0) < 40).length;

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
                ? `Students currently taking ${selectedCourse.name}`
                : "Choose a course to view students currently taking it."}
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
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="admin-surface relative overflow-hidden lg:col-span-2 bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5">
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

              <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Risk Snapshot
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">At Risk</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {atRiskCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">On Track</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {Math.max(0, filteredStudents.length - atRiskCount)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
                    Students with progress below 40% are flagged as at risk.
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                  No active students currently taking this course.
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Students Table
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                      {filteredStudents.length} students
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-medium">Student</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Progress</th>
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
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/teacher/students/${student.id}`}
                                className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              >
                                View Student
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
