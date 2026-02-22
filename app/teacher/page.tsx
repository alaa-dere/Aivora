"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from 'next/image';
import {
  Users, BookOpen, BrainCircuit, Award, ChevronRight, Sun, Moon,
  TrendingUp, Clock, AlertTriangle, CheckCircle, XCircle, Video,
  Calendar, Bell, FileText, Link as LinkIcon, Download, Upload,
  BarChart3, GraduationCap, Zap, Sparkles, Target, Trophy, Activity,
  PieChart, PlusCircle, PlayCircle, UserPlus, MessageSquare, Eye,
  MoreVertical
} from "lucide-react";

/* ================= Stat Card ================= */
const StatCard = ({ title, value, icon, trend, color = "blue", delay = 0 }: any) => {
  const colors: any = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
      gradient: "from-blue-600 to-indigo-600"
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      gradient: "from-emerald-600 to-teal-600"
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      gradient: "from-amber-600 to-orange-600"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      border: "border-purple-200 dark:border-purple-500/20",
      text: "text-purple-600 dark:text-purple-400",
      gradient: "from-purple-600 to-pink-600"
    }
  };

  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={`backdrop-blur-xl bg-white/80 dark:bg-white/5 border ${colors[color].border} rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${colors[color].gradient} rounded-full blur-3xl`} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {title}
                {trend && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {trend}
                  </span>
                )}
              </p>
              <h3 className="text-3xl font-medium  text-slate-900 dark:text-white mt-2">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color].bg} ${colors[color].text} group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
          </div>
          <div className="mt-4 w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${colors[color].gradient} rounded-full`} style={{ width: '75%' }} />
          </div>
        </div>
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
      <div className="
        backdrop-blur-2xl 
        bg-white/40 dark:bg-blue-950/40
        border border-white/30 dark:border-white/10 
        rounded-2xl overflow-hidden 
        transition-all duration-500 
        hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10
        hover:bg-white/50 dark:hover:bg-blue-900/40
        relative
      ">
        <div className="h-40 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600">
          {course.image && !imgError ? (
            <>
              <img 
                src={course.image} 
                alt={course.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-7xl opacity-80 group-hover:scale-125 transition-transform duration-700">
                {course.emoji || '📚'}
              </span>
            </div>
          )}
          
          <div className="absolute top-3 left-3 z-10">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-white text-xs font-medium border border-white/30">
              {course.code}
            </span>
          </div>
          
          <div className="absolute top-3 right-3 z-10 flex gap-2 text-white">
            <Eye className="w-4 h-4 cursor-pointer hover:scale-110 transition" />
            <MoreVertical className="w-4 h-4 cursor-pointer hover:scale-110 transition" />
          </div>
          
          <div className="absolute bottom-3 left-3 z-10">
            <h4 className="font-medium text-white text-lg drop-shadow-lg">{course.name}</h4>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
            <div>
              <div className="flex justify-center text-slate-900 dark:text-white font-medium">
                <Users size={14} className="mr-1"/>{course.students}
              </div>
              Students
            </div>
            <div>
              <div className="flex justify-center text-slate-900 dark:text-white font-medium">
                <Trophy size={14} className="mr-1"/>{course.averageScore}%
              </div>
              Avg Score
            </div>
            <div>
              <div className="flex justify-center text-slate-900 dark:text-white font-medium">
                <Activity size={14} className="mr-1"/>{course.completion}%
              </div>
              Complete
            </div>
          </div>
          
          <div className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${gradient} rounded-full`} 
                 style={{ width: `${course.completion}%` }} />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button className="flex-1 p-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-lg text-xs hover:bg-blue-600 hover:text-white transition">
              Manage
            </button>
            <button className="p-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-lg transition hover:bg-blue-600 hover:text-white">
              <PlusCircle size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= Student Row ================= */
const StudentRow = ({ student }: any) => (
  <div className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium ">{student.avatar}</div>
      <div>
        <p className="font-medium text-slate-900 dark:text-white text-sm">{student.name}</p>
        <div className="w-20 h-1 bg-slate-200 dark:bg-white/10 rounded-full mt-1">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${student.progress}%` }} />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600">{student.status}</span>
      <MessageSquare className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600" />
    </div>
  </div>
);

/* ================= Main Dashboard ================= */
export default function TeacherDashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  if (!mounted) return null;

const courses = [
  { 
    name: " Python", 
    code: "CS401", 
    students: 45, 
    completion: 78, 
    averageScore: 82,
    image: "https://images.unsplash.com/photo-1649180556628-9ba704115795?w=400&h=200&fit=crop" // صور عشوائية مضمونة
  },
  { 
    name: "Web Development", 
    code: "CS301", 
    students: 38, 
    completion: 92, 
    averageScore: 88,
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&h=200&fit=crop"
  },
  { 
    name: "Data Structures", 
    code: "CS201", 
    students: 52, 
    completion: 65, 
    averageScore: 74,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=cro"
  },
  { 
    name: "AI Fundamentals", 
    code: "CS501", 
    students: 28, 
    completion: 45, 
    averageScore: 91,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop"
  }
];

  const students = [
    { name: "Ahmed Mohamed", avatar: "AM", progress: 85, status: "passed" },
    { name: "Sara Khaled", avatar: "SK", progress: 45, status: "failed" }
  ];

return (
    
    <div className="min-h-screen transition-all duration-500 bg-slate-50 dark:bg-[#0B0F1A] relative overflow-hidden">
      {/* 1. Global Animations */}
   <style jsx global>{`
        @keyframes fade-in-up { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes breathe { 
          0%, 100% { opacity: 0.3; transform: scale(1); } 
          50% { opacity: 0.5; transform: scale(1.05); } 
        }
        @keyframes drift { 
          0% { transform: translate(0, 0) rotate(0deg); } 
          50% { transform: translate(2%, 2%) rotate(2deg); } 
          100% { transform: translate(0, 0) rotate(0deg); } 
        }
        @keyframes glow { 
          0%, 100% { opacity: 0.2; } 
          50% { opacity: 0.4; } 
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease-out forwards; }
        .animate-breathe { animation: breathe 8s ease-in-out infinite; }
        .animate-drift { animation: drift 20s ease-in-out infinite; }
        .animate-glow { animation: glow 6s ease-in-out infinite; }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-1000">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/40" />
        
        <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute bottom-20 -left-20 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[100px] animate-drift" />
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-indigo-950/30" />
        
        <div className="absolute top-40 -right-20 w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[150px] animate-breathe" />
        <div className="absolute bottom-40 -left-20 w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[150px] animate-breathe" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-800/20 rounded-full blur-[180px] animate-drift" />
        
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-indigo-900/25 rounded-full blur-[120px] animate-glow" />
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-0 dark:opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `glow ${Math.random() * 4 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 lg:p-10 space-y-8">        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
           <h1 className="text-3xl font-medium text-slate-900 dark:text-white">
             Welcome, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-move">Dr. Sarah</span>
           </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">Your dashboard is up to date.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-500">
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button onClick={() => setShowAttendanceModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:shadow-xl hover:scale-105 transition-all duration-500 bg-[length:200%_auto] hover:from-blue-700 hover:to-indigo-700">
               <PlusCircle size={18}/> New Course
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value="1,284" icon={<Users/>} trend="+12%" color="blue" delay={0} />
          <StatCard title="Active Courses" value="6" icon={<BookOpen/>} trend="+2" color="blue" delay={100} />
          <StatCard title="Avg Score" value="78%" icon={<Target/>} trend="+5%" color="blue" delay={200} />
          <StatCard title="Completion" value="82%" icon={<Activity/>} trend="+8%" color="blue" delay={300} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section>
              <h2 className="text-xl font-medium mb-6 flex items-center gap-2 dark:text-white">
                <BookOpen className="text-blue-600"/> My Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((c, i) => <CourseCard key={i} course={c} index={i} />)}
              </div>
            </section>

            <section className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30 dark:hover:from-[#1E293B] dark:hover:to-blue-900/10">
               <h2 className="text-xl font-medium mb-6 dark:text-white flex items-center gap-2">
                 <Users className="text-blue-600"/> Student Performance
               </h2>
               <div className="space-y-2">
                  {students.map((s, i) => <StudentRow key={i} student={s} />)}
               </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
             <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <BrainCircuit className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <div className="relative z-10">
                   <h3 className="font-medium text-xl mb-4 flex items-center gap-2">
                     <Zap/> AI Insights
                   </h3>
                   <p className="text-blue-100 text-sm mb-6">Students are struggling with 'Data Structures'. Need a practice quiz?</p>
                   <button className="w-full bg-white text-blue-900 py-3 rounded-2xl font-medium text-sm hover:bg-blue-50 transition hover:scale-105 duration-300">
                     Generate Quiz
                   </button>
                </div>
             </div>

             <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 hover:shadow-2xl transition-all duration-500">
                <h3 className="font-medium dark:text-white mb-6 flex items-center gap-2">
                  <Bell className="text-blue-600"/> Notifications
                </h3>
                <div className="space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="flex gap-3 items-start group hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-xl transition-all duration-300">
                        <div className="w-2 h-2 mt-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full group-hover:scale-150 transition-transform duration-300" />
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">New student enrolled in Python Course.</p>
                          <p className="text-[10px] text-slate-400 mt-1">5 min ago</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Modal لـ showAttendanceModal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10">
              <h3 className="text-2xl font-medium mb-4 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Create New Course</h3>
              <input type="text" placeholder="Course Name" className="w-full p-4 mb-4 rounded-2xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              <textarea placeholder="Description" rows={3} className="w-full p-4 mb-4 rounded-2xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              <div className="flex gap-3 mt-6">
                 <button onClick={() => setShowAttendanceModal(false)} className="flex-1 py-3 font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all duration-300">
                   Cancel
                 </button>
                 <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                   Create
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}