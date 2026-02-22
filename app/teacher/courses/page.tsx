"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  FileText,
  Clock,
  Eye,
  Edit,
  Copy,
  Grid3x3,
  List,
  BookOpen,
  Video,
  FileVideo,
  Link as LinkIcon,
  ChevronRight,
  GraduationCap
} from "lucide-react";

export default function CoursesPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const courses = [
    {
      id: "CS401",
      name: "Advanced Python Programming",
      code: "CS401",
      students: 45,
      modules: 8,
      lessons: 24,
      progress: 78,
      lastUpdated: "2024-01-15",
      status: "active",
      thumbnail: "from-[#1E3A8A] to-[#1E40AF]",
      description: "Object-oriented programming, decorators, generators, and advanced Python concepts"
    },
    {
      id: "CS301",
      name: "Web Development with React",
      code: "CS301",
      students: 38,
      modules: 6,
      lessons: 18,
      progress: 92,
      lastUpdated: "2024-01-10",
      status: "active",
      thumbnail: "from-[#1E3A8A] to-[#2563EB]",
      description: "Modern web development with React, hooks, state management, and Next.js"
    },
    {
      id: "CS201",
      name: "Data Structures & Algorithms",
      code: "CS201",
      students: 52,
      modules: 10,
      lessons: 30,
      progress: 65,
      lastUpdated: "2024-01-05",
      status: "draft",
      thumbnail: "from-[#1E3A8A] to-[#3B82F6]",
      description: "Arrays, linked lists, trees, graphs, sorting, and searching algorithms"
    },
    {
      id: "CS501",
      name: "AI Fundamentals",
      code: "CS501",
      students: 28,
      modules: 12,
      lessons: 36,
      progress: 45,
      lastUpdated: "2024-01-20",
      status: "active",
      thumbnail: "from-[#1E3A8A] to-[#60A5FA]",
      description: "Machine learning basics, neural networks, and AI applications"
    }
  ];

  return (
    <div className="
      min-h-screen transition-all duration-500
      bg-gradient-to-br
      from-slate-100 via-white to-slate-200
      dark:from-[#0F172A] dark:via-[#111827] dark:to-[#1E293B]
    ">
      <div className="p-8 space-y-8">

        {/* Header with Dark Mode Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              My Courses
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage and organize your course content
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-slate-200 hover:bg-slate-300 text-slate-900
                dark:bg-white/10 dark:hover:bg-white/20 dark:text-white
                transition
              "
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <Link
              href="/teacher/courses/create"
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-[#1E3A8A] hover:bg-[#1E40AF] text-white
                transition
              "
            >
              <Plus className="w-5 h-5" />
              New Course
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-6">
          <div className="
            backdrop-blur-xl
            bg-white/70 dark:bg-white/5
            border border-slate-200 dark:border-white/10
            rounded-2xl p-5
          ">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Courses</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">12</p>
          </div>
          <div className="
            backdrop-blur-xl
            bg-white/70 dark:bg-white/5
            border border-slate-200 dark:border-white/10
            rounded-2xl p-5
          ">
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Courses</p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">8</p>
          </div>
          <div className="
            backdrop-blur-xl
            bg-white/70 dark:bg-white/5
            border border-slate-200 dark:border-white/10
            rounded-2xl p-5
          ">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
            <p className="text-2xl font-semibold text-[#1E3A8A] dark:text-blue-400 mt-1">163</p>
          </div>
          <div className="
            backdrop-blur-xl
            bg-white/70 dark:bg-white/5
            border border-slate-200 dark:border-white/10
            rounded-2xl p-5
          ">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Lessons</p>
            <p className="text-2xl font-semibold text-[#1E3A8A] dark:text-blue-400 mt-1">108</p>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-10 pr-4 py-3 rounded-xl
                backdrop-blur-xl
                bg-white/70 dark:bg-white/5
                border border-slate-200 dark:border-white/10
                text-slate-900 dark:text-white
                placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20
              "
            />
          </div>

          <div className="flex gap-2">
            <button className="
              px-4 py-2 rounded-xl
              backdrop-blur-xl
              bg-white/70 dark:bg-white/5
              border border-slate-200 dark:border-white/10
              text-slate-600 dark:text-slate-400
              hover:bg-slate-200 dark:hover:bg-white/20
              transition flex items-center gap-2
            ">
              <Filter className="w-5 h-5" />
              Filter
            </button>

            <div className="flex border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition ${
                  viewMode === "grid"
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition ${
                  viewMode === "list"
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="
                  backdrop-blur-xl
                  bg-white/70 dark:bg-white/5
                  border border-slate-200 dark:border-white/10
                  rounded-2xl overflow-hidden
                  transition-all duration-300
                  hover:-translate-y-2 hover:shadow-xl
                "
              >
                {/* Course Header with Gradient */}
                <div className={`h-24 bg-gradient-to-r ${course.thumbnail} p-4 relative`}>
                  <div className="absolute top-3 right-3">
                    <button className="p-1 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition">
                      <MoreVertical className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      course.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-100'
                        : 'bg-yellow-500/20 text-yellow-100'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5">
                  <Link href={`/teacher/courses/${course.code}`}>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition">
                      {course.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Code: {course.code}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">{course.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{course.students}</span>
                      </div>
                      <p className="text-xs text-slate-400">Students</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">{course.modules}</span>
                      </div>
                      <p className="text-xs text-slate-400">Modules</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                        <Video className="w-4 h-4" />
                        <span className="text-sm font-medium">{course.lessons}</span>
                      </div>
                      <p className="text-xs text-slate-400">Lessons</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-medium text-slate-900 dark:text-white">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-full transition-all duration-700"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                    <span className="text-xs text-slate-400">Updated: {course.lastUpdated}</span>
                    <Link
                      href={`/teacher/courses/${course.code}`}
                      className="text-[#1E3A8A] dark:text-blue-400 hover:text-[#1E40AF] text-sm font-medium flex items-center gap-1"
                    >
                      Manage
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="
            backdrop-blur-xl
            bg-white/70 dark:bg-white/5
            border border-slate-200 dark:border-white/10
            rounded-2xl overflow-hidden
          ">
            <table className="w-full">
              <thead className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Course</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Students</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Modules</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Lessons</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Progress</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition">
                    <td className="py-4 px-6">
                      <div>
                        <Link href={`/teacher/courses/${course.code}`} className="font-medium text-slate-900 dark:text-white hover:text-[#1E3A8A] dark:hover:text-blue-400">
                          {course.name}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{course.code}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{course.students}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{course.modules}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{course.lessons}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{course.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        course.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Link href={`/teacher/courses/${course.code}`} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition">
                          <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Link>
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition">
                          <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition">
                          <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Actions */}
        <div className="
          backdrop-blur-xl
          bg-white/70 dark:bg-white/5
          border border-slate-200 dark:border-white/10
          rounded-2xl p-6
        ">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-4">
            <button className="
              p-4 bg-slate-100/50 dark:bg-white/5
              rounded-xl hover:bg-slate-200 dark:hover:bg-white/10
              transition text-left
            ">
              <BookOpen className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 mb-2" />
              <p className="font-medium text-sm text-slate-900 dark:text-white">Add Module</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create new course module</p>
            </button>
            <button className="
              p-4 bg-slate-100/50 dark:bg-white/5
              rounded-xl hover:bg-slate-200 dark:hover:bg-white/10
              transition text-left
            ">
              <Video className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 mb-2" />
              <p className="font-medium text-sm text-slate-900 dark:text-white">Upload Video</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add new lesson video</p>
            </button>
            <button className="
              p-4 bg-slate-100/50 dark:bg-white/5
              rounded-xl hover:bg-slate-200 dark:hover:bg-white/10
              transition text-left
            ">
              <FileText className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 mb-2" />
              <p className="font-medium text-sm text-slate-900 dark:text-white">Add Material</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload PDF or slides</p>
            </button>
            <button className="
              p-4 bg-slate-100/50 dark:bg-white/5
              rounded-xl hover:bg-slate-200 dark:hover:bg-white/10
              transition text-left
            ">
              <LinkIcon className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 mb-2" />
              <p className="font-medium text-sm text-slate-900 dark:text-white">Add Link</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share external resource</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}