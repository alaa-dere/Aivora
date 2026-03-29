// app/teacher/layout.tsx
'use client';
import Image from "next/image";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Bell, MessageSquare } from 'lucide-react';
import {
  HomeIcon,
  BookOpenIcon,
  UsersIcon,
  VideoCameraIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { BrainCircuit } from 'lucide-react'; // احتفظنا بـ lucide لهذه الأيقونة فقط

const menuItems = [
  { href: '/teacher', name: 'Dashboard', icon: HomeIcon },
  { href: '/teacher/courses', name: 'My Courses', icon: BookOpenIcon },
  { href: '/teacher/quizzes', name: 'Quizzes', icon: BrainCircuit },
  { href: '/teacher/students', name: 'Students', icon: UsersIcon },
  { href: '/teacher/live-sessions', name: 'Live Sessions', icon: VideoCameraIcon },
  { href: '/teacher/messages', name: 'Messages', icon: ChatBubbleLeftRightIcon },
  { href: '/teacher/profile', name: 'Profile', icon: UserCircleIcon },
  { href: '/teacher/notifications', name: 'Notifications', icon: BellIcon },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<
    { id: string; title: string; message: string; createdAt: string; read: boolean }[]
  >([]);
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    imageUrl?: string | null;
  } | null>(null);
  const { theme, setTheme } = useTheme();

  // لتجنب مشكلة hydration مع الثيم
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const [notifRes, adminMsgRes, studentMsgRes] = await Promise.all([
          fetch('/api/teacher/dashboard?notifications=count', { cache: 'no-store' }),
          fetch('/api/teacher/messages?unreadCount=1', { cache: 'no-store' }),
          fetch('/api/teacher/chat/students?unreadCount=1', { cache: 'no-store' }),
        ]);
        const notifData = await notifRes.json();
        const adminMsgData = await adminMsgRes.json();
        const studentMsgData = await studentMsgRes.json();
        if (!notifRes.ok) return;
        const totalMessages =
          Number(adminMsgData?.total || 0) + Number(studentMsgData?.total || 0);
        if (mounted) {
          setNotificationCount(Number(notifData.total || 0));
          setMessageCount(totalMessages);
        }
      } catch (error) {
        console.error('Failed to load teacher notification count', error);
      }
    };

    loadCount();
    const id = setInterval(loadCount, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const res = await fetch('/api/teacher/profile', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && mounted) {
          setProfile({
            fullName: data?.teacher?.fullName || 'Teacher User',
            email: data?.teacher?.email || 'teacher@aivora.com',
            imageUrl: data?.teacher?.imageUrl || null,
          });
        }
      } catch {
        if (mounted) {
          setProfile({
            fullName: 'Teacher User',
            email: 'teacher@aivora.com',
            imageUrl: null,
          });
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);


  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/teacher/dashboard?notifications=1', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      const items = (data.notifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        read: Boolean(n.read),
      }));
      setNotificationItems(items);
    } catch (error) {
      console.error('Failed to load teacher notifications', error);
    }
  };
const router = useRouter();

const handleLogout = async () => {
  try {
    await Promise.all([
      fetch('/api/auth/logout', { method: 'POST' }),
      signOut({ redirect: false }),
    ]);
    router.replace('/login');
    router.refresh();
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

  if (!mounted) {
    return null; // أو skeleton loader إذا حابب
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* ──────────────── Topbar ──────────────── */}
      <header className="sticky top-0 z-30 bg-blue-950 dark:bg-gray-950 border-b border-blue-900 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="w-6 h-6 text-white" />
          </button>
                           <div className="flex items-center ml-2">
  <Image
    src="/alaa.png"
    alt="Aivora Logo"
    width={100}
    height={30}
    className="object-contain"
  />
</div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5 text-white" />
            ) : (
              <MoonIcon className="w-5 h-5 text-white" />
            )}
          </button>

          <Link
            href="/teacher/messages"
            className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5 text-white" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {messageCount > 99 ? '99+' : messageCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                const next = !notificationOpen;
                setNotificationOpen(next);
                if (next) loadNotifications();
              }}
              className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Notifications
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificationItems.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notificationItems.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                          n.read ? '' : 'bg-blue-50/40 dark:bg-blue-900/10'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    href="/teacher/notifications"
                    onClick={() => setNotificationOpen(false)}
                    className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors text-white"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ──────────────── Sidebar + Content ──────────────── */}
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-blue-900 dark:border-gray-800 bg-blue-950">
              <div className="flex items-center">
                <Image
                  src="/alaa.png"
                  alt="Aivora Logo"
                  width={100}
                  height={30}
                  className="object-contain"
                />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-blue-900/50"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Teacher Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/teacher/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  {profile?.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {profile?.fullName || 'Teacher User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile?.email || 'teacher@aivora.com'}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
