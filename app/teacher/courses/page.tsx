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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");


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
<div className="w-full">
<div className="px-6 py-6 md:px-10 space-y-8 w-full">
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

          <div>


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
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">          <div className="
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
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {courses.map((course) => (
      <div
        key={course.id}
        className="
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-2xl overflow-hidden
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl
        "
      >
        {/* Header بسيط */}
        <div className="p-4 pb-1">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
              course.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {course.status === 'active' ? 'Active' : 'Draft'}
            </span>
          </div>
          
        <Link href={`/teacher/courses/${course.code}`}>
  <h3 className="font-medium text-2xl text-gray-900 dark:text-white mt-4 mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition line-clamp-1">
    {course.name}
  </h3>
</Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">Code: {course.code}</p>
        </div>

        {/* Course Content - مكثف */}
        <div className="p-4 pt-1">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{course.description}</p>

          {/* Stats - سطر واحد */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{course.students}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{course.modules} mod</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{course.lessons} les</span>
            </div>
          </div>

          {/* Progress Bar - مصغر */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-0.5">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{course.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* Footer - مصغر */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-[10px] text-gray-400">{course.lastUpdated}</span>
            <Link
              href={`/teacher/courses/${course.code}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium flex items-center gap-0.5"
            >
              Manage
              <ChevronRight className="w-3 h-3" />
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
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">            <button className="
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