"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, BookOpen, BrainCircuit, Users, Video, 
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, Menu, Search,
  Sparkles, Sun, Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from 'next-themes'

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme()
  const darkMode = theme === 'dark'

  // wait for mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/teacher/courses", label: "My Courses", icon: <BookOpen size={20} /> },
    { href: "/teacher/quizzes", label: "AI Quizzes", icon: <BrainCircuit size={20} /> },
    { href: "/teacher/students", label: "Students", icon: <Users size={20} /> },
    { href: "/teacher/live-sessions", label: "Live Sessions", icon: <Video size={20} /> },
  ];

  // Don't render theme-dependent UI until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] transition-colors duration-500">
        {/* Sidebar and content without theme toggle */}
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] transition-colors duration-500">
      
      {/* 1. Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 2. Sidebar*/}
      <aside className={`
        fixed top-0 left-0 h-full bg-white/70 dark:bg-[#111827]/80 backdrop-blur-2xl 
        border-r border-slate-200 dark:border-white/5 shadow-xl
        transition-all duration-500 ease-in-out z-50
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          
          <div className="flex items-center h-20 px-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0 group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                
                <div className="absolute -inset-1 bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
                
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
              </div>
              
              {!sidebarCollapsed && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <h1 className="font-black text-xl tracking-tight">
                    <span className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent">
                      Aivora
                    </span>
                  </h1>
                  <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-[0.2em]">
                    AI Learning Platform
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <div className={`
                    relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/30' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}
                    ${sidebarCollapsed ? 'justify-center px-0' : ''}
                  `}>
                    <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 mt-auto">
            <div className={`
              p-4 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
              transition-all duration-300
              ${sidebarCollapsed ? 'px-2' : ''}
            `}>
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
                  S
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">Dr. Sarah Ahmed</p>
                    <p className="text-[10px] text-slate-500 truncate">Computer Science</p>
                  </div>
                )}
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button*/}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`
            absolute top-24 w-6 h-6 bg-[#1E3A8A] text-white rounded-full 
            hidden lg:flex items-center justify-center 
            border-4 border-[#F8FAFC] dark:border-[#0B0F1A] 
            hover:scale-110 transition-transform shadow-lg
            ${sidebarCollapsed ? '-right-3' : 'right-[-12px]'}
          `}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* 3. Main Content Area */}
      <div className={`
        transition-all duration-500 ease-in-out
        ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
      `}>
        {/* Modern Top Header */}
        <header className="sticky top-0 z-30 h-20 px-8 flex items-center justify-between bg-[#F8FAFC]/80 dark:bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">          

          <div className="flex items-center gap-4 ml-auto">
            {/* Dark Mode Toggle Button - with key to force re-render after mount */}
            <button 
              onClick={() => setTheme(darkMode ? 'light' : 'dark')}
              className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 transition-all"
            >
              {darkMode ? (
                <Sun key="sun" size={20} className="text-slate-600 dark:text-slate-300" />
              ) : (
                <Moon key="moon" size={20} className="text-slate-600 dark:text-slate-300" />
              )}
            </button>
            <button className="relative p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 transition-all group">
              <Bell size={20} className="text-slate-600 dark:text-slate-300 group-hover:rotate-12" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F1A]"></span>
            </button>
            <button className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 transition-all">
              <Settings size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            {/* Mobile Toggle inside Header */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-3 bg-[#1E3A8A] text-white rounded-2xl shadow-lg shadow-[#1E3A8A]/20"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Page Content with Animation */}
        <main className="p-4 lg:p-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}