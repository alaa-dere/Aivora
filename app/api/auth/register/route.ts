import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received body:", body);
    
    const { fullName, email, password, role = "student" } = body;

    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø¯Ø®Ù„Ø§Øª
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø¹Ø¯Ù… ÙˆØ¬ÙˆØ¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø³Ø¨Ù‚Ø§Ù‹
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM user WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ roleId Ù„Ù„Ø·Ø§Ù„Ø¨
    const [roleResult] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM role WHERE name = ?",
      [role]
    );

    if (roleResult.length === 0) {
      return NextResponse.json(
        { message: "Role does not exist" },
        { status: 400 }
      );
    }

    const roleId = roleResult[0].id;

    // ØªØ´ÙÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ø¥Ø¯Ø±Ø§Ø¬ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¬Ø¯ÙŠØ¯
    await pool.query(
      `INSERT INTO user (id, roleId, fullName, email, passwordHash, status, createdAt, updatedAt)
       VALUES (UUID(), ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [roleId, fullName, email, hashedPassword]
    );

    // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…Ø¶Ø§Ù
    const [newUsers] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.fullName, u.email, u.status, r.name as role
       FROM user u
       JOIN role r ON u.roleId = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (!newUsers || newUsers.length === 0) {
      throw new Error("User created but not found");
    }

    const user = newUsers[0];

    if (user.role === "student") {
      try {
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
            `${user.fullName} created a student account.`,
            user.id,
          ]
        );
      } catch (notifError: any) {
        if (notifError?.code === "ER_NO_SUCH_TABLE") {
          console.warn("admin_notification table missing; skipping admin notification insert.");
        } else {
          throw notifError;
        }
      }
    }

    // Ø¥Ù†Ø´Ø§Ø¡ JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // ØªØ¹ÙŠÙŠÙ† Ø§Ù„ÙƒÙˆÙƒÙŠØ²
    (await cookies()).set({
      name: "aivora_session",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the account" },
      { status: 500 }
    );
  }
}
