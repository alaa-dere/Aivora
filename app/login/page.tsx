"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center overflow-hidden relative">
      {/* الدائرة الكبيرة اليسرى – الحين دائرة كاملة */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] lg:w-[60vw] lg:h-[60vw] max-w-[900px] max-h-[900px] -translate-x-[30%] md:-translate-x-[20%] bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 rounded-full z-0 pointer-events-none" />

      <div className="w-full max-w-6xl relative z-10 px-4 md:px-8 lg:px-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-0 items-center min-h-[80vh]">
          {/* الجانب الأيسر – يحتوي الدائرة + المحتوى الزخرفي */}
          <div className="hidden md:flex relative items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
            </div>
          </div>

          {/* الجانب الأيمن – نموذج الدخول */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md lg:max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-8 md:p-10 lg:p-12 border border-blue-100/60">
              {/* Aivora على الموبايل فقط */}
              <div className="md:hidden text-center mb-8">
                <GraduationCap className="h-20 w-20 mx-auto text-indigo-600 mb-4" />
                <h2 className="text-5xl font-extrabold text-indigo-700">Aivora</h2>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-center text-slate-800 mb-4">
                Sign In
              </h1>
              <p className="text-center text-slate-600 mb-10 text-lg">
                Welcome back! Continue your learning journey.
              </p>

              <form className="space-y-7">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all text-base"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all text-base"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      <EyeOff size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remember" className="ml-3 text-sm text-slate-600">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg"
                >
                  SIGN IN
                  <ArrowRight size={20} />
                </button>
              </form>

              <div className="mt-10 text-center text-slate-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-800 hover:underline">
                  Sign Up
                </Link>
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
                Need help?{" "}
                <span className="text-blue-600 hover:underline cursor-pointer">Contact Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
