"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  ChartBarIcon,
  EyeIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function QuizzesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "closed">("all");

  const quizzes = [
    {
      id: 1,
      title: "Python OOP Midterm",
      course: "Advanced Python",
      questions: 25,
      timeLimit: 60,
      attempts: 45,
      avgScore: 78,
      dueDate: "2024-02-15",
      status: "active",
      type: "midterm",
    },
    {
      id: 2,
      title: "React Hooks Quiz",
      course: "Web Development",
      questions: 15,
      timeLimit: 30,
      attempts: 38,
      avgScore: 82,
      dueDate: "2024-02-20",
      status: "active",
      type: "quiz",
    },
    {
      id: 3,
      title: "Data Structures Final",
      course: "Data Structures",
      questions: 40,
      timeLimit: 120,
      attempts: 52,
      avgScore: 71,
      dueDate: "2024-03-01",
      status: "draft",
      type: "final",
    },
    {
      id: 4,
      title: "AI Basics Quiz",
      course: "AI Fundamentals",
      questions: 20,
      timeLimit: 45,
      attempts: 28,
      avgScore: 88,
      dueDate: "2024-02-10",
      status: "closed",
      type: "quiz",
    },
  ];

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quiz.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalQuizzes: quizzes.length,
    totalQuestions: quizzes.reduce((sum, q) => sum + q.questions, 0),
    totalAttempts: quizzes.reduce((sum, q) => sum + q.attempts, 0),
    avgScore: Math.round(
      quizzes.reduce((sum, q) => sum + q.avgScore, 0) / (quizzes.length || 1)
    ) || 0,
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
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Draft
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
            <XCircleIcon className="w-4 h-4" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300 space-y-6">
      {/* Header + زر Create Quiz */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Quizzes
          </h1>
        </div>

        <Link
          href="/teacher/quizzes/create"
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
          Create Quiz
        </Link>
      </div>

      {/* AI Generate Box - أعلى بعد الـ header مباشرة */}
      <div className="bg-blue-950 rounded-xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white/10 p-4 rounded-xl">
              <CpuChipIcon className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Generate Quiz with AI</h2>
              <p className="text-blue-200 mt-2 max-w-2xl text-base">
                Describe your quiz topic and let AI create questions, answers, and explanations instantly.
              </p>
            </div>
          </div>
          <button className="bg-white text-blue-950 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg whitespace-nowrap">
            Try AI Generator
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Quizzes", value: stats.totalQuizzes.toString(), trend: "+5", icon: Squares2X2Icon },
          { label: "Total Questions", value: stats.totalQuestions.toString(), trend: "+12", icon: BookOpenIcon },
          { label: "Total Attempts", value: stats.totalAttempts.toString(), trend: "+18", icon: UsersIcon },
          { label: "Average Score", value: `${stats.avgScore}%`, trend: "+4", icon: AcademicCapIcon },
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

      {/* Controls: Search + Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
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

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="
                px-3 py-2.5 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-gray-50 dark:bg-gray-900
                text-gray-800 dark:text-gray-100
                outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900
              "
            >
              <option value="all">All Quizzes</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredQuizzes.map((quiz) => (
          <div
            key={quiz.id}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpenIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <Link
                    href={`/teacher/quizzes/${quiz.id}`}
                    className="font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {quiz.title}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{quiz.course}</p>
                </div>
              </div>

              {getStatusBadge(quiz.status)}
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4 text-center text-sm">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{quiz.questions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{quiz.timeLimit}m</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{quiz.attempts}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Attempts</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{quiz.avgScore}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Due: {quiz.dueDate}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/teacher/quizzes/${quiz.id}/results`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChartBarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </Link>
                <Link
                  href={`/teacher/quizzes/${quiz.id}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <EyeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </Link>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <PencilSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <PlayCircleIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No quizzes found matching your search or filter.
        </div>
      )}

      {/* Quick Actions - آخر شيء في الصفحة */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: PlusIcon,
              title: "Create Quiz",
              desc: "Start a new quiz from scratch",
            },
            {
              icon: CpuChipIcon,
              title: "AI Generator",
              desc: "Let AI build questions for you",
            },
            {
              icon: DocumentTextIcon,
              title: "Import Questions",
              desc: "Upload from file or bank",
            },
            {
              icon: ChartBarIcon,
              title: "View Results",
              desc: "Check student performance",
            },
          ].map((action, index) => (
            <button
              key={index}
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
    </div>
  );
}