"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  Users,
  BarChart3,
  Award,
  BrainCircuit,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from "lucide-react";

export default function QuizzesPage() {
  const [filter, setFilter] = useState("all");

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
      type: "midterm"
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
      type: "quiz"
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
      type: "final"
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
      type: "quiz"
    }
  ];

 const getStatusBadge = (status: string) => {
  switch(status) {
    case 'active':
      return <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> Active</span>;
    case 'draft':
      return <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-lg"><AlertCircle className="w-3 h-3" /> Draft</span>;
    case 'closed':
      return <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg"><XCircle className="w-3 h-3" /> Closed</span>;
    default:
      return null;
  }
};

  return (
    <div className="space-y-6">
      {/* Header */}
<div className="flex justify-between items-center mb-8">
  <div>
    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
      Quizzes
    </h1>
    <p className="text-gray-500 dark:text-gray-400 mt-1">
      Create and manage quizzes with AI assistance
    </p>
  </div>
  <Link
    href="/teacher/quizzes/create"
    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white transition"
  >
    <Plus className="w-5 h-5" />
    Create Quiz
  </Link>
</div>

      {/* AI Generate Button */}
<div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-sm">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="bg-white/20 p-3 rounded-xl">
        <BrainCircuit className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Generate Quiz with AI</h2>
        <p className="text-blue-100">Describe your quiz topic and let AI create questions for you</p>
      </div>
    </div>
    <button className="bg-white text-blue-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
      Try AI Generator
    </button>
  </div>
</div>

      {/* Filters */}
<div className="flex gap-4 mb-8">
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      type="text"
      placeholder="Search quizzes..."
      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    />
  </div>
  <select
    value={filter}
    onChange={(e) => setFilter(e.target.value)}
    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
  >
    <option value="all">All Quizzes</option>
    <option value="active">Active</option>
    <option value="draft">Draft</option>
    <option value="closed">Closed</option>
  </select>
</div>

      {/* Stats Summary */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Quizzes</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizzes.length}</p>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Questions</p>
    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quizzes.reduce((acc, q) => acc + q.questions, 0)}</p>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Attempts</p>
    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{quizzes.reduce((acc, q) => acc + q.attempts, 0)}</p>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg. Score</p>
    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">80%</p>
  </div>
</div>

      {/* Quizzes Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {quizzes.map((quiz) => (
    <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link href={`/teacher/quizzes/${quiz.id}`}>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {quiz.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.course}</p>
        </div>
        {getStatusBadge(quiz.status)}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">{quiz.questions}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{quiz.timeLimit}m</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{quiz.attempts}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Attempts</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">{quiz.avgScore}%</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-400">Due: {quiz.dueDate}</span>
        <div className="flex items-center gap-2">
          <Link href={`/teacher/quizzes/${quiz.id}/results`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </Link>
          <Link href={`/teacher/quizzes/${quiz.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </Link>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            <PlayCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
    </div>
  );
}