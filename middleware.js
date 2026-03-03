import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const cookie = req.cookies.get("aivora_session")?.value;

    if (!cookie) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const session = JSON.parse(cookie);
      if (session.role !== "admin") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};