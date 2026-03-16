"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from 'next-themes'
import {
  UsersIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  SunIcon,
  MoonIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  CalendarIcon,
  BellIcon,
  DocumentTextIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrophyIcon,
  SparklesIcon,          
  PlusCircleIcon,
  PlayCircleIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";

/* ================= Stat Card ================= */
const StatCard = ({ title, value, icon: Icon, change, changeType = "increase", delay = 0 }: any) => {
  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="
        bg-white dark:bg-gray-800 
        rounded-xl 
        shadow-sm 
        border border-blue-200 dark:border-blue-800 
        p-5 
        hover:-translate-y-1 hover:shadow-lg 
        transition-all duration-200
      ">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
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
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      </div>
    </div>
  );
};

/* ================= Course Card ================= */
const CourseCard = ({ course, index }: any) => {
  const colors = ["from-blue-600 to-indigo-600", "from-emerald-600 to-teal-600", "from-amber-600 to-orange-600", "from-purple-600 to-pink-600"];
  const gradient = colors[index % colors.length];

  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="
        bg-white dark:bg-gray-800 
        rounded-xl 
        shadow-sm 
        border border-blue-200 dark:border-blue-800 
        p-5 
        hover:-translate-y-1 hover:shadow-lg 
        transition-all duration-200
      ">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BookOpenIcon className="w-6 h-6 text-blue-700 dark:text-blue-400" />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    avgScore: 0,
    completion: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/dashboard', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load teacher dashboard');
        }
        setStats(data.stats);
        setCourses(data.courses || []);
        setStudents(data.students || []);
        setRecentActivities(data.recentActivities || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load teacher dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      loadDashboard();
    }
  }, [mounted]);

  if (!mounted) return null;

  const aiInsights = [
    {
      title: 'Forecast',
      description: 'Next month Python Basics +18%',
     icon: ArrowTrendingUpIcon
    },
    {
      title: 'Risk',
      description: 'At-risk Web Dev student based on quiz performance',
      icon: ArrowTrendingDownIcon,
    },
    {
      title: 'Recommendation',
      description: 'JavaScript Async (68% wrong) needs review',
      icon: AcademicCapIcon,
    },
  ];

  const recentActivitiesFallback = [
    { type: 'ENROLL', description: 'No recent activity yet', time: '' },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 py-6 md:px-10 transition-colors duration-300">
      {/* رأس الصفحة */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* بطاقات الإحصائيات - نفس الستايل والأيقونات اللي في Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Total Students', value: stats.totalStudents.toLocaleString(), change: '+0%', changeType: 'increase', icon:UserGroupIcon, delay: 0 },
          { title: 'Active Courses', value: stats.activeCourses.toString(), change: '+0%', changeType: 'increase', icon: BookOpenIcon, delay: 100 },
          { title: 'Avg Score', value: `${stats.avgScore}%`, change: '+0%', changeType: 'increase', icon: AcademicCapIcon, delay: 200 },
          { title: 'Completion', value: `${stats.completion}%`, change: '+0%', changeType: 'increase', icon: ChartBarIcon, delay: 300 },
        ].map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            delay={stat.delay}
          />
        ))}
      </div>

      {/* باقي الأقسام (My Courses, AI Insights, Student Performance, Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* My Courses */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              My Courses
            </h2>
            <Link href="/teacher/courses" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              View All <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No courses yet.</p>
            ) : (
              courses.map((course, i) => (
              <CourseCard key={i} course={course} index={i} />
              ))
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            AI Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Smart analytics & suggestions
          </p>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <AIInsightItem key={index} icon={insight.icon} title={insight.title} description={insight.description} />
            ))}
          </div>
        </div>
      </div>

      {/* Student Performance + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Student Performance
          </h2>
          <div className="divide-y divide-blue-100 dark:divide-blue-800">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading students...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : students.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No students yet.</p>
            ) : (
              students.map((student, i) => (
                <StudentRow key={i} student={student} />
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Live platform events</p>
          <div className="space-y-4">
            {(recentActivities.length ? recentActivities : recentActivitiesFallback).map((activity, idx) => (
              <div key={idx} className="flex gap-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    activity.type === 'ENROLL'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}
                >
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
