"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";

type Props = {
  open: boolean;
  onClose: () => void;
  nextUrl?: string;
};

export default function HomeAuthModal({ open, onClose, nextUrl }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) {
      setErr("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const safeNext = nextUrl && nextUrl.startsWith("/") ? nextUrl : null;

  const handleOAuth = async (providerName: "google" | "github") => {
    setErr("");
    setLoading(true);
    try {
      const base = isLogin ? `${window.location.origin}/login?oauth=1` : `${window.location.origin}/login?social=true`;
      const callbackUrl = safeNext ? `${base}&next=${encodeURIComponent(safeNext)}` : base;
      await signIn(providerName, { callbackUrl, redirect: true });
    } catch (error) {
      console.error("OAuth sign in failed:", error);
      setErr("Unable to start OAuth sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      if (!isLogin) {
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
          setErr(registerData.message || "Registration failed. Please try again.");
          setLoading(false);
          return;
        }

        const signInResult = await signIn("credentials", {
          email: email.trim(),
          password: password.trim(),
          redirect: false,
        });

        if (signInResult?.error) {
          setErr("Account created, but login failed. Please sign in.");
          setLoading(false);
          setIsLogin(true);
          return;
        }

        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password: password.trim() }),
          });
        } catch (err) {
          console.error("Legacy login cookie set failed:", err);
        }
      } else {
        const result = await signIn("credentials", {
          email: email.trim(),
          password: password.trim(),
          redirect: false,
        });

        if (result?.error) {
          setErr("Invalid email or password.");
          setLoading(false);
          return;
        }

        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password: password.trim() }),
          });
        } catch (err) {
          console.error("Legacy login cookie set failed:", err);
        }
      }

      onClose();
      if (safeNext) {
        window.location.href = safeNext;
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Auth failed:", error);
      setErr("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLogin ? "Welcome back! Please sign in." : "Create your account to continue."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            OR
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <FaGoogle className="w-4 h-4" />
                Google
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <FaGithub className="w-4 h-4" />
                GitHub
              </span>
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin((prev) => !prev)}
              className="text-blue-600 hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
