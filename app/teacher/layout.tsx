// app/teacher/layout.tsx
'use client';
import Image from "next/image";
import { Manrope } from "next/font/google";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Bell, MessageSquare } from 'lucide-react';
import {
  HomeIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  HomeIcon as HomeSolidIcon,
  SunIcon as SunSolidIcon,
  MoonIcon as MoonSolidIcon,
} from '@heroicons/react/24/solid';

const menuItems = [
  { href: '/teacher', name: 'Dashboard', icon: HomeIcon },
  { href: '/teacher/earnings', name: 'Earnings', icon: CurrencyDollarIcon },
  { href: '/teacher/certificates', name: 'Certificates', icon: AcademicCapIcon },
  { href: '/teacher/profile', name: 'Profile', icon: UserCircleIcon },
];

const headerLinks = [
  { href: '/teacher/courses', name: 'My Courses' },
  { href: '/teacher/students', name: 'Students' },
  { href: '/teacher/live-sessions', name: 'Live Sessions' },
];

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationTypeFilter, setNotificationTypeFilter] = useState<'all' | 'course_enroll' | 'admin_message' | 'student_message'>('all');
  const [notificationItems, setNotificationItems] = useState<
    { id: string; type: string; title: string; message: string; createdAt: string; read: boolean }[]
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
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!notificationMenuRef.current) return;
      if (!notificationMenuRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const [notifRes, adminMsgRes, studentMsgRes] = await Promise.all([
          fetch('/api/teacher/dashboard?notifications=all', { cache: 'no-store' }),
          fetch('/api/teacher/messages?unreadCount=1', { cache: 'no-store' }),
          fetch('/api/teacher/chat/students?unreadCount=1', { cache: 'no-store' }),
        ]);
        const notifData = await notifRes.json();
        const adminMsgData = await adminMsgRes.json();
        const studentMsgData = await studentMsgRes.json();
        if (!notifRes.ok) return;
        const totalMessages =
          Number(adminMsgData?.total || 0) + Number(studentMsgData?.total || 0);
        const readSet = new Set<string>(
          JSON.parse(localStorage.getItem('teacher_read_notifications') || '[]')
        );
        const deletedSet = new Set<string>(
          JSON.parse(localStorage.getItem('teacher_deleted_notifications') || '[]')
        );
        const unreadNotifications = (notifData.notifications || [])
          .map((n: { id: string; read?: boolean }) => ({
            id: n.id,
            read: readSet.has(n.id) || Boolean(n.read),
          }))
          .filter((n: { id: string; read: boolean }) => !deletedSet.has(n.id))
          .filter((n: { read: boolean }) => !n.read).length;
        if (mounted) {
          setNotificationCount(Number(unreadNotifications || 0));
          setMessageCount(totalMessages);
        }
      } catch (error) {
        console.error('Failed to load teacher notification count', error);
      }
    };

    loadCount();
    const onRefresh = () => loadCount();
    window.addEventListener('notifications:refresh', onRefresh as EventListener);
    const id = setInterval(loadCount, 30000);
    return () => {
      mounted = false;
      window.removeEventListener('notifications:refresh', onRefresh as EventListener);
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
    const onProfileUpdate = () => loadProfile();
    window.addEventListener('teacher:profile-updated', onProfileUpdate as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('teacher:profile-updated', onProfileUpdate as EventListener);
    };
  }, []);


  async function loadNotifications() {
    try {
      const res = await fetch('/api/teacher/dashboard?notifications=all', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      const readSet = new Set<string>(
        JSON.parse(localStorage.getItem('teacher_read_notifications') || '[]')
      );
      const deletedSet = new Set<string>(
        JSON.parse(localStorage.getItem('teacher_deleted_notifications') || '[]')
      );
      const allItems = (data.notifications || []).map((n: { id: string; type?: string; title: string; message: string; createdAt: string; read?: boolean }) => ({
        id: n.id,
        type: String(n.type || 'course_enroll'),
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        read: readSet.has(n.id) || Boolean(n.read),
      }));
      const items = allItems
        .filter((n: { id: string }) => !deletedSet.has(n.id))
        .filter((n: { type: string }) => notificationTypeFilter === 'all' || n.type === notificationTypeFilter)
        .slice(0, 8);
      setNotificationItems(items);
    } catch (error) {
      console.error('Failed to load teacher notifications', error);
    }
  }

  const markAllNotificationsRead = async () => {
    const existing = new Set<string>(
      JSON.parse(localStorage.getItem('teacher_read_notifications') || '[]')
    );
    notificationItems.forEach((n) => existing.add(n.id));
    localStorage.setItem('teacher_read_notifications', JSON.stringify(Array.from(existing)));
    setNotificationItems((prev) => prev.map((n) => ({ ...n, read: true })));
    window.dispatchEvent(new Event('notifications:refresh'));
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
    <div className={`${manrope.className} admin-shell min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300`}>
      {/* ──────────────── Topbar ──────────────── */}
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="rounded-2xl border border-blue-900/70 dark:border-gray-800 bg-blue-950/95 dark:bg-gray-950/90 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3 flex items-center justify-between">
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

        <div className="hidden md:flex items-center gap-2">
          {headerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? 'text-sky-300'
                  : 'text-blue-100 hover:text-sky-300'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={() => {
                const next = !notificationOpen;
                setNotificationOpen(next);
                if (next) loadNotifications();
              }}
              className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            >
              <BellSolidIcon className="w-5 h-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="admin-surface absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Notifications
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={notificationTypeFilter}
                      onChange={(e) =>
                        setNotificationTypeFilter(
                          e.target.value as 'all' | 'course_enroll' | 'admin_message' | 'student_message'
                        )
                      }
                      className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                    >
                      <option value="all">All</option>
                      <option value="course_enroll">Enrollments</option>
                      <option value="admin_message">Admin Msg</option>
                      <option value="student_message">Student Msg</option>
                    </select>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificationItems.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
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
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800">
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

          <Link
            href="/teacher/messages"
            className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            aria-label="Messages"
          >
            <ChatSolidIcon className="w-5 h-5 text-white" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {messageCount > 99 ? '99+' : messageCount}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <SunSolidIcon className="w-5 h-5 text-white" />
            ) : (
              <MoonSolidIcon className="w-5 h-5 text-white" />
            )}
          </button>

          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
            aria-label="Home"
          >
            <HomeSolidIcon className="w-5 h-5 text-white" />
          </Link>

          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="h-9 w-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center text-sm font-semibold hover:bg-blue-100 dark:hover:bg-slate-700 transition overflow-hidden"
              aria-label="Account menu"
            >
              {profile?.imageUrl ? (
                <img
                  src={profile.imageUrl}
                  alt={profile?.fullName || 'Teacher'}
                  className="h-full w-full object-cover"
                />
              ) : (
                (profile?.fullName || 'T').trim().charAt(0).toUpperCase()
              )}
            </button>

            {accountOpen && (
              <div className="admin-surface absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                <Link
                  href="/teacher/profile"
                  onClick={() => setAccountOpen(false)}
                  className="px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                >
                  <UserCircleIcon className="w-4 h-4 text-slate-500" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setAccountOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-slate-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* ──────────────── Sidebar + Content ──────────────── */}
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            admin-sidebar fixed top-4 bottom-0 left-0 z-40 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-blue-900 dark:border-gray-800 bg-blue-950 rounded-t-2xl">
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
              <button
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
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

      <style jsx global>{`
        .admin-surface {
          background: #ffffff !important;
          border: 1px solid rgba(148, 163, 184, 0.35) !important;
          box-shadow:
            0 14px 32px rgba(15, 23, 42, 0.12),
            0 2px 6px rgba(15, 23, 42, 0.08) !important;
        }

        .dark .admin-surface {
          background: #0f172a !important;
          border: 1px solid rgba(71, 85, 105, 0.5) !important;
          box-shadow:
            0 16px 34px rgba(0, 0, 0, 0.38),
            0 2px 6px rgba(0, 0, 0, 0.28) !important;
        }

        .admin-shell table {
          border-collapse: collapse;
          width: 100%;
        }

        .admin-shell table thead th {
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
          padding: 0.9rem 1rem !important;
          background: rgba(241, 245, 249, 0.9);
          color: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.45);
        }

        .dark .admin-shell table thead th {
          background: rgba(15, 23, 42, 0.7);
          color: #e2e8f0;
          border-bottom: 1px solid rgba(51, 65, 85, 0.7);
        }

        .admin-shell table tbody tr {
          background: transparent;
          transition: background-color 140ms ease;
        }

        .admin-shell table tbody tr:hover {
          background: rgba(226, 232, 240, 0.55);
        }

        .dark .admin-shell table tbody tr:hover {
          background: rgba(30, 41, 59, 0.45);
        }

        .admin-shell table tbody td {
          padding: 0.95rem 1rem !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          color: inherit;
        }

        .dark .admin-shell table tbody td {
          border-bottom: 1px solid rgba(51, 65, 85, 0.6);
        }

        .admin-shell .admin-surface button[class*='bg-blue'],
        .admin-shell .admin-surface a[class*='bg-blue'] {
          background: #e0f2fe !important;
          border: 1px solid #bae6fd !important;
          color: #075985 !important;
        }

        .admin-shell .admin-surface button[class*='bg-indigo'],
        .admin-shell .admin-surface a[class*='bg-indigo'] {
          background: #e0e7ff !important;
          border: 1px solid #c7d2fe !important;
          color: #3730a3 !important;
        }

        .admin-shell .admin-surface button[class*='bg-emerald'],
        .admin-shell .admin-surface a[class*='bg-emerald'],
        .admin-shell .admin-surface button[class*='bg-green'],
        .admin-shell .admin-surface a[class*='bg-green'] {
          background: #dcfce7 !important;
          border: 1px solid #bbf7d0 !important;
          color: #166534 !important;
        }

        .admin-shell .admin-surface button[class*='bg-amber'],
        .admin-shell .admin-surface a[class*='bg-amber'],
        .admin-shell .admin-surface button[class*='bg-yellow'],
        .admin-shell .admin-surface a[class*='bg-yellow'] {
          background: #fef3c7 !important;
          border: 1px solid #fde68a !important;
          color: #92400e !important;
        }

        .admin-shell .admin-surface button[class*='bg-red'],
        .admin-shell .admin-surface a[class*='bg-red'] {
          background: #fee2e2 !important;
          border: 1px solid #fecaca !important;
          color: #991b1b !important;
        }
      `}</style>
    </div>
  );
}
