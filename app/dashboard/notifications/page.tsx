"use client";

import { useState } from "react";
import { 
  Bell,
  CheckCircle,
  AlertCircle,
  Award,
  Calendar,
  Video,
  FileText,
  MessageSquare,
  Users,
  BrainCircuit,
  Clock,
  CheckCheck,
  Filter,
  Trash2,
  Settings
} from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");

  const notifications = [
    {
      id: 1,
      type: "quiz_submission",
      title: "New Quiz Submission",
      message: "Ahmed Mohamed submitted 'Python OOP Quiz'",
      course: "Advanced Python",
      time: "5 minutes ago",
      read: false,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      bgColor: "bg-emerald-50"
    },
    {
      id: 2,
      type: "achievement",
      title: "Student Achievement",
      message: "Sara Khaled completed 100% of 'Web Development' course",
      course: "Web Development",
      time: "1 hour ago",
      read: false,
      icon: <Award className="w-5 h-5 text-purple-600" />,
      bgColor: "bg-purple-50"
    },
    {
      id: 3,
      type: "live_session",
      title: "Live Session in 30 minutes",
      message: "Your session 'Python OOP Review' starts soon",
      course: "Advanced Python",
      time: "30 minutes from now",
      read: true,
      icon: <Video className="w-5 h-5 text-blue-600" />,
      bgColor: "bg-blue-50"
    },
    {
      id: 4,
      type: "alert",
      title: "At-Risk Students Alert",
      message: "5 students are struggling in 'Data Structures'",
      course: "Data Structures",
      time: "2 hours ago",
      read: false,
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      bgColor: "bg-red-50"
    },
    {
      id: 5,
      type: "ai_suggestion",
      title: "AI Teaching Suggestion",
      message: "Generate practice exercises for OOP concepts",
      course: "Advanced Python",
      time: "3 hours ago",
      read: true,
      icon: <BrainCircuit className="w-5 h-5 text-indigo-600" />,
      bgColor: "bg-indigo-50"
    },
    {
      id: 6,
      type: "assignment",
      title: "Assignment Grading Needed",
      message: "12 assignments pending for review",
      course: "AI Fundamentals",
      time: "5 hours ago",
      read: false,
      icon: <FileText className="w-5 h-5 text-orange-600" />,
      bgColor: "bg-orange-50"
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case "quiz_submission":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "achievement":
        return <Award className="w-5 h-5 text-purple-600" />;
      case "live_session":
        return <Video className="w-5 h-5 text-blue-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "ai_suggestion":
        return <BrainCircuit className="w-5 h-5 text-indigo-600" />;
      case "assignment":
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case "quiz_submission": return "bg-emerald-50";
      case "achievement": return "bg-purple-50";
      case "live_session": return "bg-blue-50";
      case "alert": return "bg-red-50";
      case "ai_suggestion": return "bg-indigo-50";
      case "assignment": return "bg-orange-50";
      default: return "bg-slate-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your courses and students</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-slate-600" />
            Mark all as read
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "unread"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("important")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "important"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Important
          </button>
        </div>
        <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          Filter by course
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-sm text-slate-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">6</p>
              <p className="text-sm text-slate-500">Achievements</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-sm text-slate-500">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-100 divide-y">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-6 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
          >
            <div className="flex gap-4">
              <div className={`w-12 h-12 ${getNotificationColor(notification.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                    <p className="text-slate-600">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {notification.course}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">{notification.time}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Details
                  </button>
                  {notification.type === "quiz_submission" && (
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      Grade Now
                    </button>
                  )}
                  {notification.type === "live_session" && (
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      Join Session
                    </button>
                  )}
                  {notification.type === "alert" && (
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      View Students
                    </button>
                  )}
                  {notification.type === "ai_suggestion" && (
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Generate Content
                    </button>
                  )}
                </div>
              </div>

              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-medium">
          Load More Notifications
        </button>
      </div>
    </div>
  );
}