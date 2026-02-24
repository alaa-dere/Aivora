"use client";
import toast, { Toaster } from 'react-hot-toast';
import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  Download,
  MoreVertical,
  Eye,
  Edit,
  BarChart3,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Calendar,
  FileText
} from "lucide-react";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

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
      quizzes: [
        { name: "OOP Quiz", score: 88, date: "2024-02-01" },
        { name: "Decorators Quiz", score: 95, date: "2024-02-05" }
      ]
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
      quizzes: [
        { name: "OOP Quiz", score: 45, date: "2024-02-01" },
        { name: "Decorators Quiz", score: 58, date: "2024-02-05" }
      ]
    },
    {
      id: 3,
      name: "Omar Hassan",
      email: "omar.h@student.com",
      avatar: "OH",
      course: "Web Development",
      courseCode: "CS301",
      progress: 92,
      averageScore: 88,
      status: "active",
      lastActive: "1 hour ago",
      attendance: 98,
      missingAssignments: 0,
      quizzes: [
        { name: "React Hooks", score: 92, date: "2024-02-02" },
        { name: "State Management", score: 85, date: "2024-02-06" }
      ]
    },
    {
      id: 4,
      name: "Lina Ahmad",
      email: "lina.a@student.com",
      avatar: "LA",
      course: "Data Structures",
      courseCode: "CS201",
      progress: 78,
      averageScore: 81,
      status: "active",
      lastActive: "5 hours ago",
      attendance: 88,
      missingAssignments: 1,
      quizzes: [
        { name: "Arrays & Lists", score: 85, date: "2024-02-03" },
        { name: "Trees", score: 78, date: "2024-02-07" }
      ]
    },
    {
      id: 5,
      name: "Khaled Ibrahim",
      email: "khaled.i@student.com",
      avatar: "KI",
      course: "Data Structures",
      courseCode: "CS201",
      progress: 35,
      averageScore: 42,
      status: "at-risk",
      lastActive: "1 week ago",
      attendance: 45,
      missingAssignments: 5,
      quizzes: [
        { name: "Arrays & Lists", score: 38, date: "2024-02-03" },
        { name: "Trees", score: 45, date: "2024-02-07" }
      ]
    },
    {
      id: 6,
      name: "Nora Saleem",
      email: "nora.s@student.com",
      avatar: "NS",
      course: "AI Fundamentals",
      courseCode: "CS501",
      progress: 95,
      averageScore: 94,
      status: "active",
      lastActive: "30 minutes ago",
      attendance: 100,
      missingAssignments: 0,
      quizzes: [
        { name: "Neural Networks", score: 96, date: "2024-02-04" },
        { name: "Machine Learning", score: 92, date: "2024-02-08" }
      ]
    },
    {
      id: 7,
      name: "Mohammed Ali",
      email: "mohammed.a@student.com",
      avatar: "MA",
      course: "Web Development",
      courseCode: "CS301",
      progress: 62,
      averageScore: 68,
      status: "inactive",
      lastActive: "2 weeks ago",
      attendance: 50,
      missingAssignments: 4,
      quizzes: [
        { name: "React Hooks", score: 65, date: "2024-02-02" },
        { name: "State Management", score: 70, date: "2024-02-06" }
      ]
    }
  ];

  const courses = [
    "All Courses",
    "Advanced Python",
    "Web Development",
    "Data Structures",
    "AI Fundamentals"
  ];

  const handleExportList = () => {
    const headers = ['Name', 'Email', 'Course', 'Progress', 'Avg Score', 'Attendance', 'Status', 'Last Active'];
    const csvData = filteredStudents.map(s => [
      s.name,
      s.email,
      s.course,
      `${s.progress}%`,
      `${s.averageScore}%`,
      `${s.attendance}%`,
      s.status,
      s.lastActive
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('List exported successfully!');
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'at-risk':
        return <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg"><AlertTriangle className="w-3 h-3" /> At Risk</span>;
      case 'inactive':
        return <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-2 py-1 rounded-lg"><XCircle className="w-3 h-3" /> Inactive</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === "all" || student.course === selectedCourse;
    const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === "active").length,
    atRisk: students.filter(s => s.status === "at-risk").length,
    inactive: students.filter(s => s.status === "inactive").length,
    avgProgress: Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length),
    avgScore: Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / students.length)
  };

  return (
    <div className="w-full px-6 py-6 md:px-10 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Students
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track progress, performance, and identify at-risk students
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportList}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export List
          </button>
          <button 
            onClick={() => setShowMessageModal(true)}
            className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white transition flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Send Message
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+12 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Now</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">24</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Currently online</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Students</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(stats.active/stats.total*100)}% of total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">At Risk</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.atRisk}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">Need attention</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg. Progress</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgProgress}%</p>
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
            <div className="h-full bg-purple-600 dark:bg-purple-400 rounded-full" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg. Score</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.avgScore}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all quizzes</p>
        </div>
      </div>

      {/* AI Insights for At-Risk Students */}
      {stats.atRisk > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400">At-Risk Students Alert</h3>
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {stats.atRisk}
                </span>
              </div>
              <p className="text-red-700 dark:text-red-300 mb-4">
                Students need immediate attention due to low performance.
              </p>
              
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-700 dark:text-red-300">Avg Score: 45%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-700 dark:text-red-300">Attendance: 52%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-700 dark:text-red-300">Missing: 4.2 avg</span>
                </div>
              </div>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              View All
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Courses</option>
          <option value="Advanced Python">Advanced Python</option>
          <option value="Web Development">Web Development</option>
          <option value="Data Structures">Data Structures</option>
          <option value="AI Fundamentals">AI Fundamentals</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="at-risk">At Risk</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition flex items-center gap-2">
          <Filter className="w-5 h-5" />
          More Filters
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Student</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Course</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Progress</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Score</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Last Active</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {student.avatar}
                    </div>
                    <div>
                      <Link href={`/teacher/students/${student.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {student.name}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <span className="text-sm text-gray-900 dark:text-white">{student.course}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.courseCode}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          student.progress >= 70 ? 'bg-emerald-500' : 
                          student.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{student.progress}%</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`font-bold ${getScoreColor(student.averageScore)}`}>
                    {student.averageScore}%
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1">
                    {student.attendance >= 75 ? (
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <UserX className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      student.attendance >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {student.attendance}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {getStatusBadge(student.status)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {student.lastActive}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Link href={`/teacher/students/${student.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <Link href={`/teacher/students/${student.id}/progress`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                      <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                      <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    {student.missingAssignments > 0 && (
                      <span className="w-5 h-5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {student.missingAssignments}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Performance Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Top Performers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Performers</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {students
              .filter(s => s.status === "active")
              .sort((a, b) => b.averageScore - a.averageScore)
              .slice(0, 3)
              .map((student, index) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{student.averageScore}%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Need Improvement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Need Improvement</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="space-y-3">
            {students
              .filter(s => s.status === "at-risk")
              .sort((a, b) => a.averageScore - b.averageScore)
              .slice(0, 3)
              .map((student, index) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{student.averageScore}%</span>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {students
              .filter(s => s.lastActive.includes("hour") || s.lastActive.includes("minute"))
              .slice(0, 3)
              .map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-900 dark:text-white">{student.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{student.lastActive}</span>
                </div>
              ))}
          </div>
          <Link 
            href="/teacher/students/activity"
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
          >
            View All Activity
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Actions for At-Risk Students */}
      {stats.atRisk > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions for At-Risk Students</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left">
              <Mail className="w-5 h-5 text-red-600 dark:text-red-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Send Reminder</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To all at-risk students</p>
            </button>
            
            <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Schedule Tutoring</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Extra help session</p>
            </button>
            
            <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Generate Report</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Detailed performance</p>
            </button>
            
            <button className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-left">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Message Parents</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Send update</p>
            </button>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Send Message</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To
                </label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setSelectedStudents(students.map(s => s.id.toString()));
                    }
                  }}
                >
                  <option value="all">All Students</option>
                  <option value="at-risk">At-Risk Students</option>
                  <option value="active">Active Students</option>
                  <option value="inactive">Inactive Students</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input 
                  type="text" 
                  placeholder="Enter message subject"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea 
                  rows={5}
                  placeholder="Type your message here..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 resize-none"
                />
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Will be sent to {selectedStudents.length || students.length} students
              </p>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowMessageModal(false);
                    toast.success('Message sent successfully!');
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}