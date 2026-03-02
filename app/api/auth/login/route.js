import "dotenv/config";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const normalizedEmail = (email || "").trim().toLowerCase();
    const pwd = password || "";

    if (!normalizedEmail || !pwd) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });

    if (!user || user.status !== "active") {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(pwd, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const res = NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
    });

    res.cookies.set(
      "aivora_session",
      JSON.stringify({ id: user.id, role: user.role.name }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      }
    );

    return res;
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}