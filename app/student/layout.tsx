// app/student/layout.tsx
'use client';
import Image from "next/image";
import { Manrope } from "next/font/google";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, Menu,
  Sun, Moon, X, MessageSquare
} from "lucide-react";
import {
  HomeIcon,
  ChartBarIcon,
  BookOpenIcon,
  PlayCircleIcon,
  AcademicCapIcon,
  CreditCardIcon,
  TrophyIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ClipboardDocumentCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  HomeIcon as HomeSolidIcon,
  SunIcon as SunSolidIcon,
  MoonIcon as MoonSolidIcon,
} from '@heroicons/react/24/solid';
import {
  API_ROUTES,
  normalizeNotificationList,
  normalizeStudentProfileResponse,
} from '@aivora/shared';

const navigation = [
  { name: 'Dashboard', href: '/student', icon: ChartBarIcon },
  { name: 'My Courses', href: '/student/my-courses', icon: PlayCircleIcon },
  { name: 'Explore Courses', href: '/student/courses', icon: BookOpenIcon },
  { name: 'Certificates', href: '/student/certificates', icon: AcademicCapIcon },
  { name: 'Certificate Quizzes', href: '/student/certificate-quizzes', icon: ClipboardDocumentCheckIcon },
  { name: 'Leaderboard', href: '/student/leaderboard', icon: TrophyIcon },
];

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<
    { id: string; title: string; message: string; createdAt: string; read: boolean }[]
  >([]);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<{ fullName: string; email: string; imageUrl?: string | null } | null>(null);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

 const handleLogout = async () => {
  try {
    await Promise.all([
      fetch(API_ROUTES.auth.logout, { method: 'POST' }),
      signOut({ redirect: false }),
    ]);
    router.replace('/login');
    router.refresh();
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch(API_ROUTES.student.profile, { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && mounted) {
          setProfile(normalizeStudentProfileResponse(data));
        }
      } catch {
        if (mounted) {
          setProfile({
            fullName: 'Student User',
            email: 'student@aivora.com',
            imageUrl: null,
          });
        }
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadMessageCount = async () => {
      try {
        const res = await fetch(API_ROUTES.student.chatTeachersUnreadCount, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || !mounted) return;
        setMessageCount(Number(data.total || 0));
      } catch (error) {
        console.error('Failed to load student message count', error);
      }
    };

    loadMessageCount();
    const id = setInterval(loadMessageCount, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadNotificationCount = async () => {
      try {
        const res = await fetch(API_ROUTES.student.dashboardNotificationsCount, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !mounted) return;
        setNotificationCount(Number(data.total || 0));
      } catch (error) {
        console.error('Failed to load student notification count', error);
      }
    };

    loadNotificationCount();
    const onRefresh = () => loadNotificationCount();
    window.addEventListener('student-notifications:refresh', onRefresh as EventListener);
    const id = setInterval(loadNotificationCount, 30000);
    return () => {
      mounted = false;
      window.removeEventListener('student-notifications:refresh', onRefresh as EventListener);
      clearInterval(id);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch(API_ROUTES.student.dashboardNotifications, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      setNotificationItems(normalizeNotificationList(data.notifications));
    } catch (error) {
      console.error('Failed to load student notifications', error);
    }
  };

  return (
    <div className={`${manrope.className} portal-shell min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300`}>
      {/* Header - نفس ستايل الأدمن */}
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

        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                const next = !notificationOpen;
                setNotificationOpen(next);
                if (next) loadNotifications();
              }}
              className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <BellSolidIcon className="w-5 h-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="portal-surface absolute right-0 mt-2 w-80 max-w-[85vw] rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
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
                    href="/student/notifications"
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
            href="/student/chat"
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
                  alt={profile?.fullName || 'Student'}
                  className="h-full w-full object-cover"
                />
              ) : (
                (profile?.fullName || 'S').trim().charAt(0).toUpperCase()
              )}
            </button>

            {accountOpen && (
              <div className="portal-surface absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                <Link
                  href="/student/profile"
                  onClick={() => setAccountOpen(false)}
                  className="block px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Profile
                </Link>
                <Link
                  href="/student/favorites"
                  onClick={() => setAccountOpen(false)}
                  className="block px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Favorite Courses
                </Link>
                <button
                  onClick={() => {
                    setAccountOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed top-4 bottom-0 left-0 z-40 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
        >
          <div className="h-full flex flex-col">
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

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 mr-3 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/student/profile"
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
                    {profile?.fullName || 'Student User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile?.email || 'student@aivora.com'}
                  </p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <style jsx global>{`
        .portal-surface {
          background: #ffffff !important;
          border: 1px solid rgba(148, 163, 184, 0.35) !important;
          box-shadow:
            0 14px 32px rgba(15, 23, 42, 0.12),
            0 2px 6px rgba(15, 23, 42, 0.08) !important;
        }

        .dark .portal-surface {
          background: #0f172a !important;
          border: 1px solid rgba(71, 85, 105, 0.5) !important;
          box-shadow:
            0 16px 34px rgba(0, 0, 0, 0.38),
            0 2px 6px rgba(0, 0, 0, 0.28) !important;
        }

        .portal-shell table {
          border-collapse: collapse;
          width: 100%;
        }

        .portal-shell table thead th {
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
          padding: 0.9rem 1rem !important;
          background: rgba(241, 245, 249, 0.9);
          color: #0f172a;
          border-bottom: 1px solid rgba(148, 163, 184, 0.45);
        }

        .dark .portal-shell table thead th {
          background: rgba(15, 23, 42, 0.7);
          color: #e2e8f0;
          border-bottom: 1px solid rgba(51, 65, 85, 0.7);
        }

        .portal-shell table tbody tr {
          background: transparent;
          transition: background-color 140ms ease;
        }

        .portal-shell table tbody tr:hover {
          background: rgba(226, 232, 240, 0.55);
        }

        .dark .portal-shell table tbody tr:hover {
          background: rgba(30, 41, 59, 0.45);
        }

        .portal-shell table tbody td {
          padding: 0.95rem 1rem !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          color: inherit;
        }

        .dark .portal-shell table tbody td {
          border-bottom: 1px solid rgba(51, 65, 85, 0.6);
        }

        .portal-shell .portal-surface button[class*='bg-blue'],
        .portal-shell .portal-surface a[class*='bg-blue'] {
          background: #e0f2fe !important;
          border: 1px solid #bae6fd !important;
          color: #075985 !important;
        }

        .portal-shell .portal-surface button[class*='bg-indigo'],
        .portal-shell .portal-surface a[class*='bg-indigo'] {
          background: #e0e7ff !important;
          border: 1px solid #c7d2fe !important;
          color: #3730a3 !important;
        }

        .portal-shell .portal-surface button[class*='bg-emerald'],
        .portal-shell .portal-surface a[class*='bg-emerald'],
        .portal-shell .portal-surface button[class*='bg-green'],
        .portal-shell .portal-surface a[class*='bg-green'] {
          background: #dcfce7 !important;
          border: 1px solid #bbf7d0 !important;
          color: #166534 !important;
        }

        .portal-shell .portal-surface button[class*='bg-amber'],
        .portal-shell .portal-surface a[class*='bg-amber'],
        .portal-shell .portal-surface button[class*='bg-yellow'],
        .portal-shell .portal-surface a[class*='bg-yellow'] {
          background: #fef3c7 !important;
          border: 1px solid #fde68a !important;
          color: #92400e !important;
        }

        .portal-shell .portal-surface button[class*='bg-red'],
        .portal-shell .portal-surface a[class*='bg-red'] {
          background: #fee2e2 !important;
          border: 1px solid #fecaca !important;
          color: #991b1b !important;
        }
      `}</style>
    </div>
  );
}
