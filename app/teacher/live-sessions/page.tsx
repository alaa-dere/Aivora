"use client";

import { useState } from "react";
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
  ChevronRight
} from "lucide-react";

export default function LiveSessionsPage() {
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled':
        return <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'live':
        return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium animate-pulse"><Video className="w-3 h-3" /> Live Now</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-medium"><XCircle className="w-3 h-3" /> Cancelled</span>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Sessions</h1>
          <p className="text-slate-500 mt-1">Schedule and manage virtual classes with your students</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Schedule Session
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+2 this week</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">24</p>
          <p className="text-sm text-slate-500">Total Sessions</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">8</p>
          <p className="text-sm text-slate-500">Upcoming</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">163</p>
          <p className="text-sm text-slate-500">Total Attendees</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">78%</p>
          <p className="text-sm text-slate-500">Avg. Attendance</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search sessions by title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => setView("upcoming")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === "upcoming"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView("past")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === "past"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Past Sessions
          </button>
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All
          </button>
        </div>

        <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          Filter
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{session.title}</h3>
                  {getStatusBadge(session.status)}
                </div>
                
                <p className="text-sm text-slate-500 mb-4">
                  {session.course} • {session.courseCode}
                </p>
                
                <p className="text-sm text-slate-600 mb-4">
                  {session.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      {session.status === "scheduled" 
                        ? `${session.attendees}/${session.totalStudents} registered`
                        : `${session.attendees}/${session.totalStudents} attended`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                    <a 
                      href={session.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 truncate"
                    >
                      {session.zoomLink}
                    </a>
                  </div>
                </div>

                {/* Attendance Bar for completed sessions */}
                {session.status === "completed" && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Attendance Rate</span>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round((session.attendees / session.totalStudents) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                        style={{ width: `${(session.attendees / session.totalStudents) * 100}%` }}
                      />
                    </div>
                    
                    {/* Attendance List Preview */}
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
                          <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-xs font-bold">
                            +3
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">Attended</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          {session.totalStudents - session.attendees} absent
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration for upcoming sessions */}
                {session.status === "scheduled" && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-blue-700">Registration Status</span>
                        <p className="text-xs text-blue-600 mt-1">
                          {session.attendees} students registered • {session.totalStudents - session.attendees} spots left
                        </p>
                      </div>
                      <button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                        Send Reminder
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 ml-6">
                {session.status === "live" && (
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 w-full justify-center">
                    <Video className="w-4 h-4" />
                    Join Now
                  </button>
                )}
                
                {session.status === "scheduled" && (
                  <>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 w-full justify-center">
                      <PlayCircle className="w-4 h-4" />
                      Start Session
                    </button>
                    <button className="border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 w-full justify-center">
                      <Mail className="w-4 h-4 text-slate-600" />
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
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 w-full justify-center"
                    >
                      <Download className="w-4 h-4" />
                      Recording
                    </a>
                    <button className="border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 w-full justify-center">
                      <BarChart3 className="w-4 h-4 text-slate-600" />
                      Analytics
                    </button>
                  </>
                )}
                
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <Copy className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Analytics */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Attendance by Course</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Advanced Python</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Web Development</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Data Structures</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">AI Fundamentals</span>
                <span className="font-medium">88%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 rounded-full" style={{ width: "88%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
              <Calendar className="w-5 h-5 text-blue-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Schedule Session</p>
              <p className="text-xs text-slate-500">Plan a new live class</p>
            </button>
            
            <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
              <Video className="w-5 h-5 text-purple-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Start Instant</p>
              <p className="text-xs text-slate-500">Begin impromptu session</p>
            </button>
            
            <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
              <Users className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Take Attendance</p>
              <p className="text-xs text-slate-500">Mark attendance manually</p>
            </button>
            
            <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
              <FileText className="w-5 h-5 text-orange-600 mb-2" />
              <p className="font-medium text-sm text-slate-900">Generate Report</p>
              <p className="text-xs text-slate-500">Attendance analytics</p>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors">
            Start Now
          </button>
        </div>
      </div>
    </div>
  );
}