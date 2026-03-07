"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  Bell,
  BrainCircuit,
  CheckCircle,
  FileText,
  Filter,
  Trash2,
  Users,
  Video,
} from "lucide-react";

type NotificationType =
  | "quiz_submission"
  | "achievement"
  | "live_session"
  | "alert"
  | "ai_suggestion"
  | "assignment";

type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  course: string;
  time: string;
  read: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: 1,
    type: "quiz_submission",
    title: "New Quiz Submission",
    message: "Ahmed Mohamed submitted 'Python OOP Quiz'",
    course: "Advanced Python",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: 2,
    type: "achievement",
    title: "Student Achievement",
    message: "Sara Khaled completed 100% of 'Web Development' course",
    course: "Web Development",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "live_session",
    title: "Live Session in 30 minutes",
    message: "Your session 'Python OOP Review' starts soon",
    course: "Advanced Python",
    time: "30 minutes from now",
    read: true,
  },
  {
    id: 4,
    type: "alert",
    title: "At-Risk Students Alert",
    message: "5 students are struggling in 'Data Structures'",
    course: "Data Structures",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 5,
    type: "ai_suggestion",
    title: "AI Teaching Suggestion",
    message: "Generate practice exercises for OOP concepts",
    course: "Advanced Python",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 6,
    type: "assignment",
    title: "Assignment Grading Needed",
    message: "12 assignments pending for review",
    course: "AI Fundamentals",
    time: "5 hours ago",
    read: false,
  },
];

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "quiz_submission":
      return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case "achievement":
      return <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
    case "live_session":
      return <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case "alert":
      return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case "ai_suggestion":
      return <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    case "assignment":
      return <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
  }
}

function getTypeBg(type: NotificationType) {
  switch (type) {
    case "quiz_submission":
      return "bg-emerald-100 dark:bg-emerald-900/30";
    case "achievement":
      return "bg-violet-100 dark:bg-violet-900/30";
    case "live_session":
      return "bg-blue-100 dark:bg-blue-900/30";
    case "alert":
      return "bg-red-100 dark:bg-red-900/30";
    case "ai_suggestion":
      return "bg-indigo-100 dark:bg-indigo-900/30";
    case "assignment":
      return "bg-amber-100 dark:bg-amber-900/30";
    default:
      return "bg-gray-100 dark:bg-gray-700";
  }
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }

    if (filter === "important") {
      return notifications.filter((n) => n.type === "alert" || n.type === "live_session");
    }

    return notifications;
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Stay updated with your courses and students
          </p>
        </div>

      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("important")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "important"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Important
          </button>

          <button className="ml-auto inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Filter className="w-4 h-4" />
            Filter by course
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Notifications List{" "}
            <span className="text-gray-400 font-normal">({filteredNotifications.length})</span>
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 md:p-5 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 ${
                !notification.read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`w-11 h-11 rounded-lg ${getTypeBg(notification.type)} flex items-center justify-center shrink-0`}
                >
                  {getTypeIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.read && (
                      <span className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {notification.course}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>{notification.time}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3">
                    <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      View Details
                    </button>
                    {notification.type === "quiz_submission" && (
                      <button className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                        Grade Now
                      </button>
                    )}
                    {notification.type === "live_session" && (
                      <button className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                        Join Session
                      </button>
                    )}
                    {notification.type === "alert" && (
                      <button className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                        View Students
                      </button>
                    )}
                    {notification.type === "ai_suggestion" && (
                      <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                        Generate Content
                      </button>
                    )}
                  </div>
                </div>

                <button className="h-fit p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button className="px-6 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          Load More Notifications
        </button>
      </div>
    </div>
  );
}
