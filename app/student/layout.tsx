// app/student/layout.tsx
'use client';
import Image from "next/image";
import { Manrope } from "next/font/google";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { useRef } from 'react';
import {
  HomeIcon,
  UserCircleIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  HomeIcon as HomeSolidIcon,
  SunIcon as SunSolidIcon,
  MoonIcon as MoonSolidIcon,
} from '@heroicons/react/24/solid';

const headerLinks = [
  { name: 'My Courses', href: '/student/my-courses' },
  { name: 'Explore Courses', href: '/student/courses' },
  { name: 'Certificates', href: '/student/certificates' },
  { name: 'Certificate Quizzes', href: '/student/certificate-quizzes' },
  { name: 'Leaderboard', href: '/student/leaderboard' },
];

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

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

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch('/api/student/profile', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && mounted) {
          setProfile({
            fullName: data?.student?.fullName || 'Student User',
            email: data?.student?.email || 'student@aivora.com',
            imageUrl: data?.student?.imageUrl || null,
          });
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
    const onProfileUpdated = () => loadProfile();
    window.addEventListener('student:profile-updated', onProfileUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('student:profile-updated', onProfileUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadMessageCount = async () => {
      try {
        const res = await fetch('/api/student/chat/teachers?unreadCount=1', {
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
        const res = await fetch('/api/student/dashboard?notifications=count', { cache: 'no-store' });
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
      const res = await fetch('/api/student/dashboard?notifications=1', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      const items = (data.notifications || []).map((n: { id: string; title: string; message: string; createdAt: string; readAt?: string | null }) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        read: Boolean(n.readAt),
      }));
      setNotificationItems(items);
    } catch (error) {
      console.error('Failed to load student notifications', error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/student/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_notifications_read' }),
      });
      setNotificationItems((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event('student-notifications:refresh'));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setNotificationOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  return (
    <div className={`${manrope.className} portal-shell min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300`}>
      {/* Header - نفس ستايل الأدمن */}
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="rounded-2xl border border-blue-900/70 dark:border-gray-800 bg-blue-950/95 dark:bg-gray-950/90 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center">
                 <Link href="/student" className="flex items-center" aria-label="Go to dashboard">
                  <Image
                    src="/alaa.png"
                    alt="Aivora Logo"
                    width={100}
                    height={30}
                    className="object-contain"
                  />
                 </Link>
        </div>

        <div className="hidden md:flex items-center gap-1 lg:gap-2 overflow-x-auto">
          {headerLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-sky-300' : 'text-blue-100 hover:text-sky-300'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
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
              <div className="portal-surface absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Notifications
                  </p>
                  <button
                    onClick={markAllNotificationsRead}
                    className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    Mark all read
                  </button>
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

          <div className="relative" ref={accountMenuRef}>
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
              <div className="portal-surface absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
                <Link
                  href="/student"
                  onClick={() => setAccountOpen(false)}
                  className="px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                >
                  <HomeIcon className="w-4 h-4 text-slate-500" />
                  Dashboard
                </Link>
                <Link
                  href="/student/profile"
                  onClick={() => setAccountOpen(false)}
                  className="px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                >
                  <UserCircleIcon className="w-4 h-4 text-slate-500" />
                  Profile
                </Link>
                <Link
                  href="/student/favorites"
                  onClick={() => setAccountOpen(false)}
                  className="px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                >
                  <HeartIcon className="w-4 h-4 text-slate-500" />
                  Favorite Courses
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

      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

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
