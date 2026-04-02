'use client';
import Image from "next/image";
import { Manrope } from "next/font/google";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // ← أضف useRouter
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  HomeIcon,
  ChartBarIcon,
  PencilSquareIcon,
  UsersIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  AcademicCapIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  HomeIcon as HomeSolidIcon,
  SunIcon as SunSolidIcon,
  MoonIcon as MoonSolidIcon,
} from '@heroicons/react/24/solid';

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); // ← أضف هذا السطر
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(() => pathname.startsWith('/dashboard/finance'));
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<
    { id: string; title: string; message: string; createdAt: string; read: boolean }[]
  >([]);
  const [messageNotifItems, setMessageNotifItems] = useState<
    { id: string; teacherId: string; title: string; message: string; createdAt: string }[]
  >([]);

  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          fetch('/api/admin/notifications/count', { cache: 'no-store' }),
          fetch('/api/admin/messages?unreadCount=1', { cache: 'no-store' }),
        ]);
        const notifData = await notifRes.json();
        const msgData = await msgRes.json();
        if (!notifRes.ok) return;
        const unreadFromThreads = Number(msgData?.total || 0);
        if (mounted) setMessageCount(unreadFromThreads);
        if (mounted) setNotificationCount(Number(notifData.total || 0) + unreadFromThreads);
      } catch (error) {
        console.error('Failed to load notification count', error);
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


  const loadNotifications = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        fetch('/api/admin/notifications', { cache: 'no-store' }),
        fetch('/api/admin/messages', { cache: 'no-store' }),
      ]);
      const notifData = await notifRes.json();
      const msgData = await msgRes.json();
      if (!notifRes.ok) return;
      const items = (notifData.notifications || []).slice(0, 5).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        read: Boolean(n.readAt),
      }));
      setNotificationItems(items);

      const messageItems = (msgData.threads || [])
        .filter((t: any) => Number(t.unreadCount || 0) > 0)
        .slice(0, 5)
        .map((t: any) => ({
          id: t.id,
          teacherId: t.teacherId,
          title: `New message from ${t.teacherName || 'Teacher'}`,
          message: t.lastMessage || 'New message',
          createdAt: t.lastMessageAt,
        }));
      setMessageNotifItems(messageItems);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  // ← أضف دالة handleLogout هنا
  const handleLogout = async () => {
    try {
      await Promise.all([
        fetch('/api/auth/logout', { method: 'POST' }),
        signOut({ redirect: false }),
      ]);
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`${manrope.className} admin-shell min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300`}>

      {/* HEADER */}
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="admin-topbar rounded-3xl border border-blue-900/70 dark:border-gray-800 bg-blue-950/95 dark:bg-gray-950/90 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
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
          <div className="relative">
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
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificationItems.length === 0 && messageNotifItems.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    <>
                      {messageNotifItems.map((n) => (
                        <Link
                          key={n.id}
                          href={`/dashboard/messages?teacherId=${n.teacherId}`}
                          onClick={() => setNotificationOpen(false)}
                          className="block px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-blue-50/60 dark:hover:bg-blue-900/20"
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
                        </Link>
                      ))}
                      {notificationItems.map((n) => (
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
                      ))}
                    </>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800">
                  <Link
                    href="/dashboard/notifications"
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
            href="/dashboard/messages"
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
              className="h-9 w-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center text-sm font-semibold hover:bg-blue-100 dark:hover:bg-slate-700 transition"
              aria-label="Account menu"
            >
              A
            </button>

            {accountOpen && (
              <div className="admin-surface absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
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

      {/* باقي الكود كما هو... */}
      <div className="flex">

        {/* SIDEBAR */}
        <aside
          className={`
            admin-sidebar fixed top-4 bottom-0 left-0 z-40 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl
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

              {/* Dashboard */}
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChartBarIcon className="w-5 h-5 mr-3" />
                Dashboard
              </Link>

              {/* USERS DROPDOWN */}
              <button
                onClick={() => setUsersOpen(!usersOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg ${
                  pathname.startsWith('/dashboard/students') ||
                  pathname.startsWith('/dashboard/teachers')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <UsersIcon className="w-5 h-5 mr-3" />
                  Users
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    usersOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {usersOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    href="/dashboard/students"
                    onClick={() => {
                      setUsersOpen(false);
                      setSidebarOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm rounded-lg ${
                      isActive('/dashboard/students')
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Students
                  </Link>

                  <Link
                    href="/dashboard/teachers"
                    onClick={() => {
                      setUsersOpen(false);
                      setSidebarOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm rounded-lg ${
                      isActive('/dashboard/teachers')
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Teachers
                  </Link>
                </div>
              )}

              {/* Courses */}
              <Link
                href="/dashboard/courses"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard/courses')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BookOpenIcon className="w-5 h-5 mr-3" />
                Courses
              </Link>

              {/* Finance Dropdown */}
              <button
                onClick={() => setFinanceOpen(!financeOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg ${
                  pathname.startsWith('/dashboard/finance')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-3" />
                  Finance
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${financeOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {financeOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    href="/dashboard/finance/transactions"
                    onClick={() => {
                      setFinanceOpen(false);
                      setSidebarOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm rounded-lg ${
                      isActive('/dashboard/finance/transactions')
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Transactions
                  </Link>

                  <Link
                    href="/dashboard/finance/reports"
                    onClick={() => {
                      setFinanceOpen(false);
                      setSidebarOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm rounded-lg ${
                      isActive('/dashboard/finance/reports')
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Reports
                  </Link>
                </div>
              )}

              {/* Notifications */}
              <Link
                href="/dashboard/certificates"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard/certificates')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <AcademicCapIcon className="w-5 h-5 mr-3" />
                Certificates
              </Link>

            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center">
                <UserCircleIcon className="w-8 h-8 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Admin User
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    admin@aivora.com
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 text-sm font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>

          </div>
        </aside>

        {/* MAIN */}
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

        .admin-topbar {
          border-color: rgba(51, 65, 85, 0.6) !important;
          box-shadow:
            0 10px 32px rgba(2, 6, 23, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .admin-sidebar {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(14px);
        }

        .dark .admin-sidebar {
          background: rgba(2, 6, 23, 0.85) !important;
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

        .admin-shell .admin-surface button[class*='px-'],
        .admin-shell .admin-surface a[class*='px-'] {
          border-radius: 14px;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.18);
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
        }

        .admin-shell .admin-surface button[class*='px-']:hover,
        .admin-shell .admin-surface a[class*='px-']:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 26px rgba(15, 23, 42, 0.22);
          filter: brightness(1.02);
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

        .admin-shell .admin-surface button[class*='border-']:not([class*='bg-']),
        .admin-shell .admin-surface a[class*='border-']:not([class*='bg-']) {
          background: #ffffff;
          color: #0f172a !important;
          border-color: rgba(148, 163, 184, 0.6) !important;
        }

        .dark .admin-shell .admin-surface button[class*='border-']:not([class*='bg-']),
        .dark .admin-shell .admin-surface a[class*='border-']:not([class*='bg-']) {
          background: #0b1220;
          color: #e2e8f0 !important;
          border-color: rgba(71, 85, 105, 0.7) !important;
        }
      `}</style>
    </div>
  );
}
