"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, EyeOff, ArrowRight, User } from "lucide-react";
import Image from "next/image";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* الدائرة الخلفية المقطوعة */}
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
    ? "polygon(0 0, 100% 0, 100% 100%, 40% 100%, 40% 0)" // للوجن
    : "polygon(0 0, 60% 0, 60% 100%, 0 100%)", // للتسجيل
}}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D2951] via-[#2a356b] to-[#1D2951] rounded-full" />

        {/* محتوى الدائرة (لوجو + نصوص) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ x: isLogin ? "25%" : "-25%" ,
                 y: "-30px",
            }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="text-center text-white w-full pointer-events-auto"
          >
            <div
              className={`
                flex flex-col items-center justify-center
                transition-all duration-700
                  -translate-y-6
                ${isLogin ? "translate-x-[-4%]" : "translate-x-[4%]"}
              `}
            >
              <Image
                src="/logo2.png"
                alt="Logo"
                width={320}
                height={320}
                className="
                  w-100 h-100 
                  sm:w-100 sm:h-100 
                  md:w-100 md:h-100
                  lg:w-120 lg:h-120 
                  object-contain 
                  drop-shadow-2xl 
                  mb-4
                "
                quality={95}
                priority
              />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg px-6">
                {isLogin ? "Welcome Back!" : "Start Your Journey"}
              </h2>
              <p className="text-sm sm:text-base opacity-90 max-w-[260px] sm:max-w-xs md:max-w-sm mx-auto drop-shadow leading-relaxed px-6">
                {isLogin
                  ? "Ready to learn something new today?"
                  : "Your learning adventure starts here"}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* طبقة الظل الداخلي (اختياري - يمكنك حذفه إذا ما كان ضروري) */}
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

      {/* منطقة الفورم */}
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
                  {isLogin
                    ? "Welcome back! Please sign in."
                    : "Start your learning journey today."}
                </p>
              </div>

              <form className="space-y-5 sm:space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D2951]" size={18} />
                      <input
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
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 focus:border-[#1D2951] focus:ring-2 focus:ring-[#1D2951]/30 outline-none transition text-base"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      <EyeOff size={18} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#1D2951] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#2563eb] text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-base"
                >
                  {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#1D2951] font-medium hover:underline"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}