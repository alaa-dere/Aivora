'use client';
import Image from "next/image";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // ← أضف useRouter
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { Bell, MessageSquare } from "lucide-react";
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
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); // ← أضف هذا السطر
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(() => pathname.startsWith('/dashboard/finance'));
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
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
  const isHome = pathname === '/';

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
    const id = setInterval(loadCount, 30000);
    return () => {
      mounted = false;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-blue-950 dark:bg-gray-950 border-b border-blue-900 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
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
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5 text-white" />
            ) : (
              <MoonIcon className="w-5 h-5 text-white" />
            )}
          </button>

          <Link
            href="/dashboard/messages"
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
                  {notificationItems.length === 0 && messageNotifItems.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
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
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                      ))}
                    </>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
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

          {/* ← أضف onClick للزر */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors text-white"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* باقي الكود كما هو... */}
      <div className="flex">

        {/* SIDEBAR */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
        >
          <div className="h-full flex flex-col">

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

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

              {/* Home */}
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isHome
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <HomeIcon className="w-5 h-5 mr-3" />
                Home
              </Link>

              {/* Dashboard */}
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Reports
                  </Link>
                </div>
              )}

              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard/notifications')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                Notifications
              </Link>

              {/* Messages */}
              <Link
                href="/dashboard/messages"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard/messages')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Messages
              </Link>

            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <UserCircleIcon className="w-8 h-8 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    admin@aivora.com
                  </p>
                </div>
              </div>
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
    </div>
  );
}
