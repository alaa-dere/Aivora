"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const roleRoute: Record<string, string> = {
  admin: "/dashboard",
  teacher: "/teacher",
  student: "/student",
};

export default function HomeUserMenu({ isArabic }: { isArabic?: boolean }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status !== "authenticated") return null;

  const name = session.user?.name || session.user?.email || "User";
  const initial = name.trim().charAt(0).toUpperCase();
  const sessionImageUrl =
    (session.user as { image?: string; imageUrl?: string | null } | undefined)?.image ||
    (session.user as { imageUrl?: string | null } | undefined)?.imageUrl ||
    null;
  const [imageUrl, setImageUrl] = useState<string | null>(sessionImageUrl);
  const role = session.user?.role?.toLowerCase() || "student";
  const dashboard = roleRoute[role] || "/student";

  useEffect(() => {
    let mounted = true;
    if (sessionImageUrl) {
      setImageUrl(sessionImageUrl);
      return;
    }
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile/me', { cache: 'no-store' });
        const data = await res.json();
        if (mounted && res.ok) {
          setImageUrl(data?.user?.imageUrl || null);
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [sessionImageUrl]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={() => setImageUrl(null)}
            />
          ) : (
            initial
          )}
        </div>
        <span className="hidden sm:inline text-sm">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-stone-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-50">
          <Link
            href={dashboard}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            {isArabic ? "لوحة التحكم" : "Dashboard"}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            {isArabic ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
