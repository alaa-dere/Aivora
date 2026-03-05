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

    // التحقق من المدخلات
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

    // التحقق من عدم وجود المستخدم مسبقاً
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM User WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    // الحصول على roleId للطالب
    const [roleResult] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM Role WHERE name = ?",
      [role]
    );

    if (roleResult.length === 0) {
      return NextResponse.json(
        { message: "Role does not exist" },
        { status: 400 }
      );
    }

    const roleId = roleResult[0].id;

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إدراج المستخدم الجديد
    await pool.query(
      `INSERT INTO User (id, roleId, fullName, email, passwordHash, status, createdAt, updatedAt)
       VALUES (UUID(), ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [roleId, fullName, email, hashedPassword]
    );

    // الحصول على المستخدم المضاف
    const [newUsers] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.fullName, u.email, u.status, r.name as role
       FROM User u
       JOIN Role r ON u.roleId = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (!newUsers || newUsers.length === 0) {
      throw new Error("User created but not found");
    }

    const user = newUsers[0];

    // إنشاء JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // تعيين الكوكيز
    (await cookies()).set({
      name: "token",
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