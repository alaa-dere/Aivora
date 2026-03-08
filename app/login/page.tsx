"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, EyeOff, Eye, ArrowRight, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useSearchParams();
  const social = params.get("social");
  const oauth = params.get("oauth");
  
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // معالجة بيانات OAuth عند العودة
useEffect(() => {
  if (status !== "authenticated" || social !== "true") return;

  const email = session?.user?.email;
  if (!email) {
    setIsLogin(false);
    setFullName(session?.user?.name || "");
    setErr("GitHub did not return an email. Please enter your email to complete account creation.");
    return;
  }

  fetch(`/api/auth/check?email=${encodeURIComponent(email)}`)
    .then((r) => r.json())
    .then(async (data) => {
      if (data.exists) {
        await signOut({ redirect: false });
        setIsLogin(true);
        setEmail(email);
        setErr("This email is already in use. Please sign in.");
      } else {
        // جديد من OAuth → نموذج إكمال بيانات (بدون password)
        setEmail(email);
        setFullName(session.user.name || "");
        setIsLogin(false);
        setErr("Almost there! Please complete your profile");
        // يمكنك إخفاء حقل كلمة المرور هنا
      }
    })
    .catch(() => {
      setErr("Failed to check account");
    });
}, [status, session, social, router]);

  // OAuth sign-in (without social registration flow): redirect authenticated users to their dashboard.
  useEffect(() => {
    if (status !== "authenticated" || social === "true" || oauth !== "1") return;
    const email = session?.user?.email;
    if (!email) {
      void signOut({ redirect: false });
      setErr("Your provider did not return an email. Please use another sign-in method.");
      return;
    }

    fetch(`/api/auth/check?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.exists) {
          await signOut({ redirect: false });
          setErr("This Google/GitHub email is not registered. Create an account first, then link social login.");
          return;
        }

        const role = data.role?.toLowerCase() || "student";
        const routes: Record<string, string> = {
          admin: "/dashboard",
          teacher: "/teacher",
          student: "/student",
        };

        router.push(routes[role] || "/student");
        router.refresh();
      })
      .catch(() => {
        setErr("Failed to validate account");
      });
  }, [status, session, social, oauth, router]);

  // التحقق من وجود خطأ
  useEffect(() => {
    const error = params.get('error');
    if (error) {
      if (error === 'OAuthAccountNotLinked') {
        setErr('This email is already linked to another account. Please sign in with your original method.');
      } else if (error === 'OAuthNoAccount') {
        setErr('This Google/GitHub email is not registered. Create an account first, then link social login.');
      } else if (error === 'OAuthEmailMissing') {
        setErr('Your provider did not return an email. Please use another sign-in method.');
      } else {
        setErr('Authentication failed. Please try again.');
      }
    }
  }, [params]);

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setErr("");
  setSuccess("");
  setLoading(true);

  try {
    // ─── حالة التسجيل (Sign Up) ───
    if (!isLogin) {
      // 1. جاء المستخدم من OAuth (Google/GitHub) ويُكمل البيانات
      if (social === "true" && session?.user) {
        // نرسل طلب لإكمال الحساب بدون كلمة مرور
        const completeRes = await fetch("/api/auth/social-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim() || session.user.name || "",
            password: password.trim(),
            email: email.trim(),
            // يمكنك إضافة حقول أخرى إذا أردت (مثل: phone, preferredRole, etc.)
            // role: selectedRole || "student",
          }),
        });

        const completeData = await completeRes.json();

        if (!completeRes.ok) {
          setErr(completeData.error || "فشل في إكمال التسجيل");
          setLoading(false);
          return;
        }

        // بعد الإنشاء الناجح → توجه مباشرة (الجلسة موجودة بالفعل)
        const role = session.user.role?.toLowerCase() || "student";
        const routes: Record<string, string> = {
          admin: "/dashboard",
          teacher: "/teacher",
          student: "/student",
        };

        setSuccess("Account created successfully. Redirecting...");
        window.setTimeout(() => {
          router.push(routes[role] || "/");
          router.refresh();
        }, 900);
        return;
      }

      // 2. تسجيل عادي جديد (Credentials) → يحتاج اسم + إيميل + كلمة مرور
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setErr(registerData.message || "فشل التسجيل، حاول مرة أخرى");
        setLoading(false);
        return;
      }

      // بعد التسجيل الناجح → نسجل الدخول تلقائيًا
      const signInResult = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (signInResult?.error) {
        setErr("تم إنشاء الحساب لكن فشل تسجيل الدخول، جرب تسجيل الدخول يدويًا");
        setIsLogin(true);
        setLoading(false);
        return;
      }

      // جلب الجلسة الجديدة لمعرفة الدور
      const sessionRes = await fetch("/api/auth/session");
      const currentSession = await sessionRes.json();
      const role = currentSession?.user?.role?.toLowerCase() || "student";

      const routes: Record<string, string> = {
        admin: "/dashboard",
        teacher: "/teacher",
        student: "/student",
      };

      setSuccess("Account created successfully. Redirecting...");
      window.setTimeout(() => {
        router.push(routes[role] || "/");
        router.refresh();
      }, 900);
      return;
    }

    // ─── حالة تسجيل الدخول (Sign In) ───
    const result = await signIn("credentials", {
      email: email.trim(),
      password: password.trim(),
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setErr("Invalid email or password. If this account was created with Google/GitHub, sign in using that provider.");
      } else {
        setErr(result.error || "Invalid email or password");
      }
      setLoading(false);
      return;
    }

    // جلب الجلسة بعد تسجيل الدخول الناجح
    const sessionRes = await fetch("/api/auth/session");
    const currentSession = await sessionRes.json();
    const role = currentSession?.user?.role?.toLowerCase() || "student";

    const routes: Record<string, string> = {
      admin: "/dashboard",
      teacher: "/teacher",
      student: "/student",
    };

    setSuccess("Login successful. Redirecting...");
    window.setTimeout(() => {
      router.push(routes[role] || "/");
      router.refresh();
    }, 900);
  } catch (err) {
    console.error("خطأ في عملية المصادقة:", err);
    setErr("حدث خطأ في الاتصال بالخادم، حاول لاحقًا");
  } finally {
    setLoading(false);
  }
}

  // دالة للتعامل مع OAuth - توجيه إلى المزود ثم العودة للتسجيل
  const handleOAuthSignUp = async (providerName: "google" | "github") => {
    setErr("");
    setLoading(true);

    try {
      const callbackUrl = isLogin
        ? `${window.location.origin}/login?oauth=1`
        : `${window.location.origin}/login?social=true`;

      await signIn(providerName, {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("OAuth sign in failed:", error);
      setErr("Unable to start OAuth sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* الدائرة الخلفية - كما هي */}
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
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0a2540] via-[#0f3d63] to-[#031625] rounded-full opacity-95"
          style={{
            maskImage: "radial-gradient(circle, black 70%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(circle, black 70%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ x: isLogin ? "60%" : "-60%" }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="pointer-events-auto"
          >
            <Image
              src="/logo2.png"
              alt="Logo"
              width={280}
              height={280}
              className="w-500 h-500 sm:w-500 sm:h-500 md:w-80 md:h-80 lg:w-120 lg:h-120 object-contain drop-shadow-2xl"
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
            <div className="w-full max-w-md bg-blue/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-2xl">
              <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {isLogin ? "Sign In" : "Create Account"}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2">
                  {isLogin 
                    ? "Welcome back! Please sign in." 
                    : email 
                      ? "Complete your registration" 
                      : "Start your learning journey today."}
                </p>
              </div>

              {err && (
                <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  {err}
                </div>
              )}

              {success && (
                <div className="mb-5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003153]" size={18} />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        type="text"
                        placeholder="John Doe"
                        autoComplete="name"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#003153] focus:ring-2 focus:ring-[#003153]/30 outline-none transition text-base"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003153]" size={18} />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#003153] focus:ring-2 focus:ring-[#003153]/30 outline-none transition text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003153]" size={18} />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 focus:border-[#003153] focus:ring-2 focus:ring-[#003153]/30 outline-none transition text-base"
                      required
                      minLength={6}
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
                  {!isLogin && (
                    <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
                  )}
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          alert("Please enter your email to receive reset link");
                          return;
                        }

                        try {
                          setLoading(true);
                          const res = await fetch('/api/auth/forgot-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: email.trim() }),
                          });

                          const data = await res.json();

                          if (res.ok) {
                            alert("Reset link sent if email exists in our system");
                          } else {
                            alert(data.message || "Error sending reset link");
                          }
                        } catch (err) {
                          alert("Error connecting to server");
                          console.error("Forgot password error:", err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-sm text-[#003153] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#003153] to-[#00447c] hover:from-[#00447c] hover:to-[#005a9e] disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-base"
                >
                  {loading ? "PLEASE WAIT..." : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* خيارات السوشال ميديا */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-500">
                    {isLogin ? "Or sign in with" : "Or sign up with"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("google")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 text-slate-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
                
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("github")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 text-slate-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErr("");
                  }}
                  className="text-[#003153] font-medium hover:underline"
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



