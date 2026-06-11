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
  SunIcon,
  MoonIcon,
  ClockIcon,
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
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";

/* ================= Stat Card ================= */
const StatCard = ({ title, value, icon: Icon, change, changeType = "increase", delay = 0 }: any) => {
  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      </div>
    </div>
  );
};

/* ================= Course Card ================= */
const CourseCard = ({ course, index }: any) => {
  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
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
            <p className="font-semibold text-gray-800 dark:text-gray-100">{course.completion}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{course.averageScore}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
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
    </div>
  );
};

/* ================= Student Row ================= */
const StudentRow = ({ student }: any) => {
  const status = (student.status || 'in_progress').toString();
  const isCompleted = status === 'completed';
  const isDropped = status === 'dropped';
  const badgeClass = isCompleted
    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    : isDropped
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
  const badgeLabel = isCompleted ? 'completed' : isDropped ? 'dropped' : 'continue';

  return (
    <div className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-blue-100/80 dark:border-blue-900/50 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {student.imageUrl ? (
          <img
            src={student.imageUrl}
            alt={`${student.name} profile`}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-bold">
            {student.avatar}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{student.name}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 truncate">
            Course: {student.courseName || 'Unknown course'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Progress: {student.progress}%</p>
        </div>
      </div>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full h-fit ${badgeClass}`}>
        {badgeLabel}
      </span>
    </div>
  );
};

function formatRelativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Since now';
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `Since ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Since ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Since ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Since ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Since ${months}mo`;
  const years = Math.floor(months / 12);
  return `Since ${years}y`;
}

function getActivityAppearance(type: string) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('enroll')) {
    return {
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      border: 'border-blue-200/80 dark:border-blue-900/40',
      hover: 'hover:bg-blue-50/60 dark:hover:bg-blue-900/20',
      iconWrap: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      icon: UserGroupIcon,
    };
  }
  if (normalized.includes('course')) {
    return {
      badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-900/40',
      hover: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20',
      iconWrap: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      icon: BookOpenIcon,
    };
  }
  return {
    badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
    border: 'border-violet-200/80 dark:border-violet-900/40',
    hover: 'hover:bg-violet-50/60 dark:hover:bg-violet-900/20',
    iconWrap: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    icon: SparklesIcon,
  };
}

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

  const recentActivitiesFallback = [
    { type: 'ENROLL', description: 'No recent activity yet', time: '' },
  ];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      {/* رأس الصفحة */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your courses, students, and progress.
        </p>
      </div>

      {/* بطاقات الإحصائيات - نفس الستايل والأيقونات اللي في Admin */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          { title: 'Total Students', value: stats.totalStudents.toLocaleString(), icon:UserGroupIcon, delay: 0 },
          { title: 'Active Courses', value: stats.activeCourses.toString(), icon: BookOpenIcon, delay: 100 },
          { title: 'Avg Score', value: `${stats.avgScore}%`, icon: AcademicCapIcon, delay: 200 },
          { title: 'Completion', value: `${stats.completion}%`, icon: ChartBarIcon, delay: 300 },
        ].map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            delay={stat.delay}
          />
        ))}
      </div>

      {/* باقي الأقسام (My Courses, Student Performance, Recent Activity) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* My Courses */}
        <div className="admin-surface lg:col-span-2 relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 sm:p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
              My Courses
            </h2>
            <Link href="/teacher/courses" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              View All <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No courses yet.</p>
            ) : (
              courses.slice(0, 2).map((course, i) => (
                <div key={i} className={i === 1 ? 'hidden md:block' : ''}>
                  <CourseCard course={course} index={i} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Student Performance + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
          <h2 className="text-base sm:text-[18px] font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Student Performance
          </h2>
          <div className="space-y-3">
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

        <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <h2 className="text-base sm:text-[18px] font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Live platform events</p>
          <div className="space-y-3">
            {(recentActivities.length ? recentActivities : recentActivitiesFallback).map((activity, idx) => (
              (() => {
                const style = getActivityAppearance(activity.type);
                const ActivityIcon = style.icon;
                return (
                  <div
                    key={idx}
                    className={`flex gap-2.5 py-2 px-2.5 rounded-lg border bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm transition-colors ${style.border} ${style.hover}`}
                  >
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${style.iconWrap}`}>
                      <ActivityIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full h-fit ${style.badge}`}>
                      {activity.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-5">{activity.description}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 inline-flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatRelativeTime(activity.time)}
                      </p>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

