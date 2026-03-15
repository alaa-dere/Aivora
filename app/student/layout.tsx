// app/student/layout.tsx
'use client';
import Image from "next/image";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { 
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, Menu,
  Sun, Moon, X
} from "lucide-react";
import {
  HomeIcon,
  BookOpenIcon,
  PlayCircleIcon,
  AcademicCapIcon,
  CreditCardIcon,
  SparklesIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/student', icon: HomeIcon },
  { name: 'My Courses', href: '/student/my-courses', icon: PlayCircleIcon },
  { name: 'Explore Courses', href: '/student/courses', icon: BookOpenIcon },
  { name: 'Certificates', href: '/student/certificates', icon: AcademicCapIcon },
  { name: 'Wallet & Payments', href: '/student/wallet', icon: CreditCardIcon },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header - نفس ستايل الأدمن */}
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
          
           {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button> 
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors text-white"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
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
              <div className="flex items-center">
                <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Student User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">student@aivora.com</p>
                </div>
              </div>
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
    </div>
  );
}
