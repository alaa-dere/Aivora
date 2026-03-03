// app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج" });

  // حذف الكوكي
  response.cookies.set("aivora_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,           // يحذفه فورًا
  });

  return response;
}