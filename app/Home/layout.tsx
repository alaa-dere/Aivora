'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header - نفس القياسات والشكل بالضبط زي الداشبورد */}
      <header className="sticky top-0 z-40 bg-blue-950 dark:bg-gray-950 border-b border-blue-900 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        {/* Left: Logo - بدون Admin Portal */}
        <Link href="/" className="flex items-center">
          <div className="flex items-center ml-2">
            <AcademicCapIcon className="w-8 h-8 text-white mr-2" />
            <h1 className="text-xl font-bold text-white">Aivora</h1>
          </div>
        </Link>

        {/* Right: Icons + Admin Login */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
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

          {/* Login */}
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors text-white">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}