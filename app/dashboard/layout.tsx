// app/admin/layout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, BookOpen, BrainCircuit, Users, Video, 
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, Menu,
  Sun, Moon, X
} from "lucide-react";
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
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/dashboard/user', icon: UsersIcon },
  { name: 'Courses', href: '/dashboard/courses', icon: BookOpenIcon },
  { name: 'Finance', href: '/dashboard/finance', icon: CurrencyDollarIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    // هنا ضع منطق تسجيل الخروج الفعلي (مسح التوكن، إعادة التوجيه، إلخ)
    console.log('Logout clicked');
    // مثال: router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* شريط علوي بلون كحلي غامق جداً */}
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
            <AcademicCapIcon className="w-8 h-8 text-white mr-2" />
            <div className="leading-tight">
            <h1 className="text-xl font-bold text-white">Aivora</h1>
              <p className="text-[11px] text-blue-100/80">Admin Portal</p>
          </div>
        </div>
</div>
        <div className="flex items-center space-x-3">
          {/* زر تبديل الثيم */}
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

          {/* زر تسجيل الخروج بنص "Logout" */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-gray-800 transition-colors text-white"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* حاوية رئيسية */}
      <div className="flex">
        {/* السايد بار - يظهر عند الضغط على زر الهامبرغر */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
        >
          <div className="h-full flex flex-col">
            {/* رأس السايد بار - شعار أزرق */}
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

            {/* روابط التنقل */}
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

            {/* معلومات المستخدم في الأسفل */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">admin@aivora.com</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* طبقة خلفية معتمة عند فتح السايد بار */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}