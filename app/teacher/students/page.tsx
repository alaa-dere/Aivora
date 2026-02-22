"use client";

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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'at-risk':
        return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg"><AlertTriangle className="w-3 h-3" /> At Risk</span>;
      case 'inactive':
        return <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg"><XCircle className="w-3 h-3" /> Inactive</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Track progress, performance, and identify at-risk students</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5 text-slate-600" />
            Export List
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Message
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-1">
          <p className="text-sm text-slate-500 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-emerald-600 mt-1">+12 this month</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-1">
          <p className="text-sm text-slate-500 mb-1">Active Now</p>
          <p className="text-2xl font-bold text-emerald-600">24</p>
          <p className="text-xs text-slate-500 mt-1">Currently online</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-1">
          <p className="text-sm text-slate-500 mb-1">Active Students</p>
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          <p className="text-xs text-slate-500 mt-1">{Math.round(stats.active/stats.total*100)}% of total</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-1">
          <p className="text-sm text-slate-500 mb-1">At Risk</p>
          <p className="text-2xl font-bold text-red-600">{stats.atRisk}</p>
          <p className="text-xs text-red-600 mt-1">Need attention</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-1">
          <p className="text-sm text-slate-500 mb-1">Avg. Progress</p>
          <p className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</p>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-2">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-1">
          <p className="text-sm text-slate-500 mb-1">Avg. Score</p>
          <p className="text-2xl font-bold text-orange-600">{stats.avgScore}%</p>
          <p className="text-xs text-slate-500 mt-1">Across all quizzes</p>
        </div>
      </div>

      {/* AI Insights for At-Risk Students */}
      {stats.atRisk > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">At-Risk Students Alert</h3>
                <p className="text-red-100 mb-2">
                  {stats.atRisk} students are currently at risk of falling behind. 
                  They have low attendance, poor quiz scores, or missing assignments.
                </p>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm">Average score: 45%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm">Attendance: 52%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm">Missing assignments: 4.2 avg</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors">
              View All
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
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
          className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="at-risk">At Risk</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          More Filters
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Student</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Course</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Progress</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Avg. Score</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Attendance</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Last Active</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {student.avatar}
                    </div>
                    <div>
                      <Link href={`/teacher/students/${student.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                        {student.name}
                      </Link>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <span className="text-sm text-slate-900">{student.course}</span>
                    <p className="text-xs text-slate-500">{student.courseCode}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          student.progress >= 70 ? 'bg-emerald-500' : 
                          student.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{student.progress}%</span>
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
                      student.attendance >= 75 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {student.attendance}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {getStatusBadge(student.status)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    {student.lastActive}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Link href={`/teacher/students/${student.id}`} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-slate-600" />
                    </Link>
                    <Link href={`/teacher/students/${student.id}/progress`} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <BarChart3 className="w-4 h-4 text-slate-600" />
                    </Link>
                    <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </button>
                    {student.missingAssignments > 0 && (
                      <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
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
      <div className="grid grid-cols-3 gap-6 mt-8">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Top Performers</h3>
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
                    <span className="text-sm font-medium text-slate-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-slate-900">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600">{student.averageScore}%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Need Improvement */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Need Improvement</h3>
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
                    <span className="text-sm font-medium text-slate-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-slate-900">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600">{student.averageScore}%</span>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {students
              .filter(s => s.lastActive.includes("hour") || s.lastActive.includes("minute"))
              .slice(0, 3)
              .map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-slate-900">{student.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{student.lastActive}</span>
                </div>
              ))}
          </div>
          <Link 
            href="/teacher/students/activity"
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
          >
            View All Activity
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Actions for At-Risk Students */}
      {stats.atRisk > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions for At-Risk Students</h3>
          <div className="grid grid-cols-4 gap-4">
            <button className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-left">
              <Mail className="w-5 h-5 text-red-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Send Reminder</p>
              <p className="text-xs text-slate-500">To all at-risk students</p>
            </button>
            
            <button className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
              <GraduationCap className="w-5 h-5 text-blue-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Schedule Tutoring</p>
              <p className="text-xs text-slate-500">Extra help session</p>
            </button>
            
            <button className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left">
              <FileText className="w-5 h-5 text-purple-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Generate Report</p>
              <p className="text-xs text-slate-500">Detailed performance</p>
            </button>
            
            <button className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-left">
              <MessageSquare className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Message Parents</p>
              <p className="text-xs text-slate-500">Send update</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}