"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  UsersIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  VideoCameraIcon,
  DocumentTextIcon,
  LinkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // بيانات وهمية (استبدليها ببيانات حقيقية لاحقًا)
    useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/courses', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load courses');
        }
        setCourses(data.courses || []);
        setStats(data.stats || {
          totalCourses: 0,
          activeCourses: 0,
          totalStudents: 0,
          totalLessons: 0,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // فلترة الكورسات
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // إحصائيات سريعة
  const displayStats = {
    totalCourses: stats.totalCourses,
    activeCourses: stats.activeCourses,
    totalStudents: stats.totalStudents,
    totalLessons: stats.totalLessons,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            My Courses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your courses, content, and student progress.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Courses", value: displayStats.totalCourses.toString(), icon: Squares2X2Icon },
          { label: "Active Courses", value: displayStats.activeCourses.toString(), icon: BookOpenIcon },
          { label: "Total Students", value: displayStats.totalStudents.toString(), icon: UsersIcon },
          { label: "Total Lessons", value: displayStats.totalLessons.toString(), icon: AcademicCapIcon },
        ].map((card) => (
          <div
            key={card.label}
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

      {/* Controls: Search + Filter */}
      <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or code..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="
                px-3 py-2.5 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : filteredCourses.map((course) => (
          <div
            key={course.id}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpenIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <Link
                    href={`/teacher/courses/${course.id}/content`}
                    className="font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {course.name}
                  </Link>
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
              {course.description}
            </p>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{course.students}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{course.progress}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{course.lessons}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <Link
                href={`/teacher/courses/${course.id}/content`}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Manage Content
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && filteredCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No courses found matching your search or filter.
        </div>
      )}

    </div>
  );
}




