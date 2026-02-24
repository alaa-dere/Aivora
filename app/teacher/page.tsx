"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from 'next/image';
import { useTheme } from 'next-themes'
import {
  Users, BookOpen, BrainCircuit, Award, ChevronRight, Sun, Moon,
  TrendingUp, Clock, AlertTriangle, CheckCircle, XCircle, Video,
  Calendar, Bell, FileText, Link as LinkIcon, Download, Upload,
  BarChart3, GraduationCap, Zap, Sparkles, Target, Trophy, Activity,
  PieChart, PlusCircle, PlayCircle, UserPlus, MessageSquare, Eye,
  MoreVertical, TrendingDown
} from "lucide-react";

/* ================= Stat Card ================= */
const StatCard = ({ title, value, icon, change, changeType = "increase", delay = 0 }: any) => {
  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            {icon}
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              changeType === 'increase'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {change}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  );
};

/* ================= Course Card ================= */
const CourseCard = ({ course, index }: any) => {
  const [imgError, setImgError] = useState(false);
  const colors = ["from-blue-600 to-indigo-600", "from-emerald-600 to-teal-600", "from-amber-600 to-orange-600", "from-purple-600 to-pink-600"];
  const gradient = colors[index % colors.length];

  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white text-lg">{course.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.code}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-white">{course.students}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Students</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-white">{course.averageScore}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-white">{course.completion}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Complete</p>
          </div>
        </div>
        
        <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full bg-gradient-to-r ${gradient} rounded-full`} 
            style={{ width: `${course.completion}%` }} 
          />
        </div>
        
        <div className="flex justify-end">
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= Student Row ================= */
const StudentRow = ({ student }: any) => (
  <div className="flex items-center justify-between py-4 px-2 border-b border-blue-100 dark:border-blue-800 last:border-0">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-sm font-bold">
        {student.avatar}
      </div>
      <div>
        <p className="font-medium text-gray-800 dark:text-gray-200">{student.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Progress: {student.progress}%</p>
      </div>
    </div>
    <span className={`text-xs px-3 py-1.5 rounded-full ${
      student.status === 'passed' 
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    }`}>
      {student.status === 'passed' ? 'passed' : 'failed'}
    </span>
  </div>
);

/* ================= AI Insight Item ================= */
const AIInsightItem = ({ icon: Icon, title, description, color = "text-blue-600 dark:text-blue-400" }: any) => (
  <div className="flex gap-4 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg h-fit">
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <h3 className="font-medium text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  </div>
);

/* ================= Main Dashboard ================= */
export default function TeacherDashboard() {
const { theme } = useTheme();
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;

  if (!mounted) return null;

  const stats = [
    { title: 'Total Students', value: '1,284', change: '+12%', changeType: 'increase', icon: Users, delay: 0 },
    { title: 'Active Courses', value: '6', change: '+2%', changeType: 'increase', icon: BookOpen, delay: 100 },
    { title: 'Avg Score', value: '78%', change: '+5%', changeType: 'increase', icon: Target, delay: 200 },
    { title: 'Completion', value: '82%', change: '+8%', changeType: 'increase', icon: Activity, delay: 300 },
  ];

  const courses = [
    { name: "Advanced Python", code: "CS401", students: 45, completion: 78, averageScore: 82 },
    { name: "Web Development", code: "CS301", students: 38, completion: 92, averageScore: 88 },
    { name: "Data Structures", code: "CS201", students: 52, completion: 65, averageScore: 74 },
    { name: "AI Fundamentals", code: "CS501", students: 28, completion: 45, averageScore: 91 },
  ];

  const students = [
    { name: "Ahmed Mohamed", avatar: "AM", progress: 85, status: "passed" },
    { name: "Sara Khaled", avatar: "SK", progress: 45, status: "failed" },
    { name: "Omar Hassan", avatar: "OH", progress: 72, status: "passed" },
    { name: "Lina Ahmad", avatar: "LA", progress: 92, status: "passed" },
  ];

  const aiInsights = [
    {
      title: 'Forecast',
      description: 'Next month Python Basics +18%',
      icon: TrendingUp,
    },
    {
      title: 'Risk',
      description: 'At-risk Web Dev student based on quiz performance',
      icon: TrendingDown,
    },
    {
      title: 'Recommendation',
      description: 'JavaScript Async (68% wrong) needs review',
      icon: GraduationCap,
    },
  ];

  const recentActivities = [
    { type: 'ENROLL', description: 'Batoo enrolled in React Basics', time: '2 min ago' },
    { type: 'QUIZ', description: 'New quiz submitted in JavaScript', time: '15 min ago' },
    { type: 'CERT', description: 'Sara completed HTML & CSS', time: '1 hour ago' },
  ];

  return (
<div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 transition-colors duration-300">        {/* رأس الصفحة */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-800 dark:text-white">
          Welcome, Dr. Sarah
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your dashboard is up to date.</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={<stat.icon className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
            delay={stat.delay}
          />
        ))}
      </div>

      {/* الرسم البياني ورؤى الذكاء الاصطناعي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* قسم My Courses */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              My Courses
            </h2>
            <Link href="/teacher/courses" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, i) => (
              <CourseCard key={i} course={course} index={i} />
            ))}
          </div>
        </div>

        {/* رؤى الذكاء الاصطناعي */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            AI Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Smart analytics & suggestions
          </p>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <AIInsightItem key={index} icon={insight.icon} title={insight.title} description={insight.description} />
            ))}
          </div>
          <button className="w-full mt-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 py-3 rounded-lg text-sm font-medium transition-colors">
            Generate Quiz
          </button>
        </div>
      </div>

      {/* Student Performance و Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Student Performance
          </h2>
          <div className="divide-y divide-blue-100 dark:divide-blue-800">
            {students.map((student, i) => (
              <StudentRow key={i} student={student} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Live platform events</p>
          <div className="space-y-4">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 h-fit">
                  {activity.type}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{activity.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}