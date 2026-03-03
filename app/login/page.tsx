"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, EyeOff, Eye, ArrowRight, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("admin@aivora.com");
  const [password, setPassword] = useState("Admin@12345");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setErr("");
  setLoading(true);

  if (!email || !password) {
    setErr("الرجاء إدخال البريد وكلمة المرور");
    setLoading(false);
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErr(data.message || "فشل تسجيل الدخول");
      setLoading(false);
      return;
    }

    // ← التعديل المهم هنا
    const userRole = data.user?.role;

    console.log("Logged in role:", userRole); // ← هتشوفي في Console الـ role اللي رجع

    if (userRole === "admin") {
      router.push("/dashboard");
    } else if (userRole === "teacher") {
      router.push("/teacher");
    } else if (userRole === "student") {
      router.push("/student");
    } else {
      setErr("دور المستخدم غير معروف");
      return;
    }

    router.refresh(); // يحدث الصفحة عشان يشوف الـ session
  } catch (err) {
    setErr("خطأ في الاتصال بالسيرفر");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* الدائرة الخلفية */}
      <motion.div
        animate={{
          left: isLogin ? "0%" : "100%",
          x: isLogin ? "-50%" : "-50%",
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute top-1/2 -translate-y-1/2
          w-[110vw] h-[110vw]
          md:w-[90vw] md:h-[90vw]
          lg:w-[80vw] lg:h-[80vw]
          max-w-[1400px] max-h-[1400px]
          shadow-2xl z-0"
        style={{
          clipPath: isLogin
            ? "polygon(0 0, 100% 0, 100% 100%, 40% 100%, 40% 0)"
            : "polygon(0 0, 60% 0, 60% 100%, 0 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D2951] via-[#2a356b] to-[#1D2951] rounded-full" />

        {/* الشعار */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ x: isLogin ? "65%" : "-65%" }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="pointer-events-auto"
          >
            <Image
              src="/logo2.png"
              alt="Logo"
              width={280}
              height={280}
              className="w-250 h-250 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl"
              quality={95}
              priority
            />
          </motion.div>
        </div>
      </motion.div>

      {/* ظل داخلي */}
      <motion.div
        animate={{
          left: isLogin ? "0%" : "100%",
          x: isLogin ? "-50%" : "-50%",
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute top-1/2 -translate-y-1/2
          w-[110vw] h-[110vw]
          md:w-[90vw] md:h-[90vw]
          lg:w-[80vw] lg:h-[80vw]
          max-w-[1400px] max-h-[1400px]
          rounded-full bg-transparent pointer-events-none z-0
          blur-[0.5px]"
        style={{
          clipPath: isLogin
            ? "ellipse(75% 100% at 25% 50%)"
            : "ellipse(75% 100% at 75% 50%)",
          boxShadow: isLogin
            ? "inset 60px 0 100px -40px rgba(255,255,255,0.3)"
            : "inset -60px 0 100px -40px rgba(255,255,255,0.3)",
        }}
      />

      {/* الفورم */}
      <div className="w-full max-w-6xl relative z-10 px-4 sm:px-6 md:px-10 lg:px-12">
        <div className="relative min-h-[80vh] flex items-center">
          <motion.div
            animate={{
              marginLeft: isLogin ? "50%" : "0%",
              marginRight: isLogin ? "0%" : "50%",
            }}
            transition={{ duration: 1.2, ease: [0.25, 0.8, 0.25, 1] }}
            className="w-full md:w-1/2 flex justify-center"
          >
            <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-2xl">
              <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {isLogin ? "Sign In" : "Create Account"}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2">
                  {isLogin ? "Welcome back! Please sign in." : "Start your learning journey today."}
                </p>
              </div>

              {err && (
                <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  {err}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D2951]" size={18} />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        type="text"
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#1D2951] focus:ring-2 focus:ring-[#1D2951]/30 outline-none transition text-base"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D2951]" size={18} />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#1D2951] focus:ring-2 focus:ring-[#1D2951]/30 outline-none transition text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D2951]" size={18} />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 focus:border-[#1D2951] focus:ring-2 focus:ring-[#1D2951]/30 outline-none transition text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label="toggle password"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1D2951] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#2563eb] disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-base"
                >
                  {loading ? "PLEASE WAIT..." : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#1D2951] font-medium hover:underline"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </div>

              <div className="mt-4 text-center text-xs text-slate-500">
                Admin test: <span className="font-mono">admin@aivora.com</span> / <span className="font-mono">Admin@12345</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}