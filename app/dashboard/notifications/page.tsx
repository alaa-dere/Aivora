"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle,
  Filter,
  Trash2,
  Users,
} from "lucide-react";

type NotificationType = "student_signup" | "course_enroll";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "student_signup":
      return <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case "course_enroll":
      return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
  }
}

function getTypeBg(type: NotificationType) {
  switch (type) {
    case "student_signup":
      return "bg-blue-100 dark:bg-blue-900/30";
    case "course_enroll":
      return "bg-emerald-100 dark:bg-emerald-900/30";
    default:
      return "bg-gray-100 dark:bg-gray-700";
  }
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return items.filter((n) => !n.read);
    }

    if (filter === "important") {
      return items.filter((n) => n.type === "course_enroll");
    }

    return items;
  }, [filter, items]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;
        const mapped = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleString(),
          read: Boolean(n.readAt),
        }));
        setItems(mapped);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Notifications</h1>
        </div>

      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <button className="inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Filter className="w-4 h-4" />
            Filter by course
          </button>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "unread" | "important")}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="important">Important</option>
            </select>
          </div>
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
          {loading && (
            <div className="p-5 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          )}
          {!loading && filteredNotifications.length === 0 && (
            <div className="p-5 text-sm text-gray-500 dark:text-gray-400">
              No notifications yet.
            </div>
          )}
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
                    <span>{notification.time}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="h-fit p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
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
