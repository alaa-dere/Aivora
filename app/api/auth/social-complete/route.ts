// app/api/auth/social-complete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { fullName, password, email } = await req.json();

  try {
    if (password && String(password).trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const sessionEmail = session.user.email?.trim().toLowerCase();
    const inputEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const targetEmail = sessionEmail || inputEmail;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Email is required to complete GitHub registration." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM user WHERE email = ?",
      [targetEmail]
    );

    if (rows.length === 0) {
      const [roleRows] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM role WHERE name = ? LIMIT 1",
        ["student"]
      );
      if (roleRows.length === 0) {
        return NextResponse.json({ error: "Role 'student' not found" }, { status: 500 });
      }

      const passwordHash = await bcrypt.hash(
        password?.trim()
          ? String(password).trim()
          : `${targetEmail}:${Date.now()}`,
        10
      );

      await pool.query(
        `INSERT INTO user (id, roleId, fullName, email, passwordHash, status, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
          roleRows[0].id,
          fullName || session.user.name || "",
          targetEmail,
          passwordHash,
        ]
      );

      const [newUserRows] = await pool.query<RowDataPacket[]>(
        "SELECT id, fullName FROM user WHERE email = ?",
        [targetEmail]
      );
      if (newUserRows.length > 0) {
        const newUser = newUserRows[0];
        const [notifIdRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
        const notifId = notifIdRows[0].id as string;
        await pool.query(
          `
          INSERT INTO admin_notification
            (id, type, title, message, studentId, createdAt)
          VALUES
            (?, 'student_signup', 'New Student Account', ?, ?, NOW())
          `,
          [
            notifId,
            `${newUser.fullName} created a student account.`,
            newUser.id,
          ]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (!sessionEmail) {
      return NextResponse.json(
        { error: "This email is already in use. Please sign in." },
        { status: 400 }
      );
    }

    if (password?.trim()) {
      const passwordHash = await bcrypt.hash(String(password).trim(), 10);
      await pool.query(
        "UPDATE user SET fullName = ?, passwordHash = ? WHERE email = ?",
        [fullName || session.user.name || "", passwordHash, targetEmail]
      );
    } else {
      await pool.query("UPDATE user SET fullName = ? WHERE email = ?", [
        fullName || session.user.name || "",
        targetEmail,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
