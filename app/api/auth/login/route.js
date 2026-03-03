// app/api/auth/login/route.js
import "dotenv/config";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/lib/db";  // ← استيراد الـ connection pool

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    // جلب المستخدم من الداتابيز باستخدام mysql2
    const [users] = await db.query(
      "SELECT u.*, r.name AS roleName FROM User u LEFT JOIN Role r ON u.roleId = r.id WHERE u.email = ?",
      [email]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { message: "الحساب غير نشط" },
        { status: 403 }
      );
    }

    // داخل الـ try block، بعد جلب user
console.log('User found:', user.email, 'Role:', user.roleName, 'Status:', user.status);

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

// بعد الـ passwordMatch
console.log('Password match result:', passwordMatch);


    // البيانات اللي هتحفظ في الكوكي
    const sessionData = {
      id: user.id,
      email: user.email,
      role: user.roleName,         // ← roleName من الـ JOIN
      fullName: user.fullName,
    };

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.roleName,
      },
    });
// قبل ضبط الكوكي
console.log('Setting session cookie with data:', sessionData);


    // ضبط الكوكي بشكل آمن
    response.cookies.set("aivora_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });

    return response;
  } catch (error) {
// في الـ catch
console.error('Login route error:', error.message);    return NextResponse.json(
      { message: "خطأ في السيرفر" },
      { status: 500 }
    );
  }
}