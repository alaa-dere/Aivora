"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Video, 
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  PlayCircle,
  Download,
  Mail,
  Bell,
  Search,
  Filter,
  BarChart3,
  UserCheck,
  UserX,
  FileText,
  MessageSquare,
  Settings,
  ChevronRight,
  X,
  Save
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function LiveSessionsPage() {
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    course: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    zoomLink: "",
    meetingId: "",
    password: "",
    reminder: "15",
    status: "scheduled"
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sessions = [
    {
      id: 1,
      title: "Python OOP Review Session",
      course: "Advanced Python",
      courseCode: "CS401",
      date: "2024-02-10",
      time: "14:00 - 16:00",
      attendees: 32,
      totalStudents: 45,
      status: "scheduled",
      zoomLink: "https://zoom.us/j/123456789",
      recording: null,
      description: "Review of Object-Oriented Programming concepts, inheritance, polymorphism, and encapsulation"
    },
    {
      id: 2,
      title: "React Hooks Workshop",
      course: "Web Development",
      courseCode: "CS301",
      date: "2024-02-12",
      time: "10:00 - 12:00",
      attendees: 28,
      totalStudents: 38,
      status: "scheduled",
      zoomLink: "https://zoom.us/j/987654321",
      recording: null,
      description: "Deep dive into useState, useEffect, useContext, and custom hooks"
    },
    {
      id: 3,
      title: "Data Structures - Trees",
      course: "Data Structures",
      courseCode: "CS201",
      date: "2024-02-05",
      time: "15:00 - 17:00",
      attendees: 41,
      totalStudents: 52,
      status: "completed",
      zoomLink: "https://zoom.us/j/456789123",
      recording: "https://drive.google.com/recording1",
      description: "Binary trees, BST, tree traversal algorithms"
    },
    {
      id: 4,
      title: "AI Neural Networks Intro",
      course: "AI Fundamentals",
      courseCode: "CS501",
      date: "2024-02-03",
      time: "11:00 - 13:00",
      attendees: 22,
      totalStudents: 28,
      status: "completed",
      zoomLink: "https://zoom.us/j/789123456",
      recording: "https://drive.google.com/recording2",
      description: "Introduction to neural networks, perceptrons, and activation functions"
    },
    {
      id: 5,
      title: "Python Decorators & Generators",
      course: "Advanced Python",
      courseCode: "CS401",
      date: "2024-02-15",
      time: "16:00 - 18:00",
      attendees: 0,
      totalStudents: 45,
      status: "scheduled",
      zoomLink: "https://zoom.us/j/456789123",
      recording: null,
      description: "Advanced Python concepts: decorators, generators, context managers"
    },
    {
      id: 6,
      title: "Web Development - Routing",
      course: "Web Development",
      courseCode: "CS301",
      date: "2024-02-08",
      time: "13:00 - 15:00",
      attendees: 35,
      totalStudents: 38,
      status: "live",
      zoomLink: "https://zoom.us/j/789123456",
      recording: null,
      description: "React Router, Next.js routing, and navigation patterns"
    }
  ];

  const courses = [
    "Advanced Python",
    "Web Development",
    "Data Structures",
    "AI Fundamentals"
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled':
        return <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'live':
        return <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full font-medium animate-pulse"><Video className="w-3 h-3" /> Live Now</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full font-medium"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return null;
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (view === "upcoming") return session.status === "scheduled" || session.status === "live";
    if (view === "past") return session.status === "completed";
    return true;
  }).filter(session => 
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleSendReminder = () => {
    toast.success('Reminder sent successfully!');
  };

  const handleStartSession = () => {
    toast.success('Session started!');
  };

  const handleJoinSession = () => {
    toast.success('Joining session...');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Session data:", formData);
    toast.success('Session scheduled successfully!');
    setShowScheduleModal(false);
    setFormData({
      title: "",
      course: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      zoomLink: "",
      meetingId: "",
      password: "",
      reminder: "15",
      status: "scheduled"
    });
  };

  return (
    <div className="w-full px-6 py-6 md:px-10 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Live Sessions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Schedule and manage virtual classes with your students
          </p>
        </div>
        <button 
          onClick={() => setShowScheduleModal(true)}
          className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Schedule Session
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">+2 this week</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">163</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendees</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">78%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Attendance</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search sessions by title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setView("upcoming")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === "upcoming"
                ? "bg-[#1E3A8A] text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView("past")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === "past"
                ? "bg-[#1E3A8A] text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Past Sessions
          </button>
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === "all"
                ? "bg-[#1E3A8A] text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
        </div>

        <button className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{session.title}</h3>
                  {getStatusBadge(session.status)}
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {session.course} • {session.courseCode}
                </p>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {session.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>
                      {session.status === "scheduled" 
                        ? `${session.attendees}/${session.totalStudents} registered`
                        : `${session.attendees}/${session.totalStudents} attended`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <a 
                      href={session.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 truncate"
                    >
                      {session.zoomLink}
                    </a>
                  </div>
                </div>

                {session.status === "completed" && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance Rate</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Math.round((session.attendees / session.totalStudents) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(session.attendees / session.totalStudents) * 100}%` }}
                      />
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                            AM
                          </div>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                            SK
                          </div>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                            OH
                          </div>
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                            +3
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Attended</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          {session.totalStudents - session.attendees} absent
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {session.status === "scheduled" && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Registration Status</span>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          {session.attendees} students registered • {session.totalStudents - session.attendees} spots left
                        </p>
                      </div>
                      <button 
                        onClick={handleSendReminder}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Send Reminder
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-auto">
                {session.status === "live" && (
                  <button 
                    onClick={handleJoinSession}
                    className="flex-1 lg:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Video className="w-4 h-4" />
                    Join Now
                  </button>
                )}
                
                {session.status === "scheduled" && (
                  <>
                    <button 
                      onClick={handleStartSession}
                      className="flex-1 lg:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Start Session
                    </button>
                    <button 
                      onClick={handleSendReminder}
                      className="flex-1 lg:flex-none border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 justify-center"
                    >
                      <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Send Reminder
                    </button>
                  </>
                )}
                
                {session.status === "completed" && session.recording && (
                  <>
                    <a 
                      href={session.recording}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 lg:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
                    >
                      <Download className="w-4 h-4" />
                      Recording
                    </a>
                    <button className="flex-1 lg:flex-none border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 justify-center">
                      <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Analytics
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handleCopyLink(session.zoomLink)}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance by Course</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Advanced Python</span>
                <span className="font-medium text-gray-900 dark:text-white">85%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Web Development</span>
                <span className="font-medium text-gray-900 dark:text-white">92%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Data Structures</span>
                <span className="font-medium text-gray-900 dark:text-white">78%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">AI Fundamentals</span>
                <span className="font-medium text-gray-900 dark:text-white">88%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 rounded-full" style={{ width: "88%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Schedule Session</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Plan a new live class</p>
            </button>
            
            <button className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
              <Video className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Start Instant</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Begin impromptu session</p>
            </button>
            
            <button className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Take Attendance</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mark attendance manually</p>
            </button>
            
            <button className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2" />
              <p className="font-medium text-sm text-gray-900 dark:text-white">Generate Report</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Attendance analytics</p>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upcoming Session Reminder</h3>
              <p className="text-amber-100">
                Your session "Python OOP Review" starts in 30 minutes. 32 students have registered.
              </p>
            </div>
          </div>
          <button 
            onClick={handleStartSession}
            className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            Start Now
          </button>
        </div>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl my-8 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Schedule New Session</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Session Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Session Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Python OOP Review Session"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="What will be covered in this session?"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Date & Time</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Meeting Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zoom Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.zoomLink}
                      onChange={(e) => setFormData({...formData, zoomLink: e.target.value})}
                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="https://zoom.us/j/123456789"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={formData.meetingId}
                      onChange={(e) => setFormData({...formData, meetingId: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="123 456 7890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="abc123"
                    />
                  </div>
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Reminder Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send reminder
                  </label>
                  <select
                    value={formData.reminder}
                    onChange={(e) => setFormData({...formData, reminder: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="1440">1 day before</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Schedule Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </form>
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