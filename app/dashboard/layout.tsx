'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // ← أضف useRouter
import { useTheme } from 'next-themes';
import { Bell } from "lucide-react";
import {
  HomeIcon,
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

  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // ← أضف دالة handleLogout هنا
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
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
            <AcademicCapIcon className="w-8 h-8 text-white mr-2" />
            <div>
              <h1 className="text-xl font-bold text-white">Aivora</h1>
              <p className="text-[11px] text-blue-100/80">Admin Portal</p>
            </div>
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

          <button className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

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
            fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
        >
          <div className="h-full flex flex-col">

            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <AcademicCapIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Aivora</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
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
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <HomeIcon className="w-5 h-5 mr-3" />
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

              {/* Finance */}
              <Link
                href="/dashboard/finance"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard/finance')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <CurrencyDollarIcon className="w-5 h-5 mr-3" />
                Finance
              </Link>

              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive('/dashboard/finance')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                Notifications
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