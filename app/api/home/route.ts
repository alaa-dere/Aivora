import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.price,
        c.imageUrl,
        c.durationWeeks,
        u.fullName AS instructor,
        COUNT(e.id) AS studentsCount
      FROM course c
      JOIN user u ON c.teacherId = u.id
      LEFT JOIN enrollment e ON e.courseId = c.id
      WHERE c.status = 'published'
      GROUP BY
        c.id,
        c.title,
        c.description,
        c.price,
        c.imageUrl,
        c.durationWeeks,
        u.fullName
      ORDER BY c.createdAt DESC
      LIMIT 4
    `);

    const courses = rows.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: Number(course.price),
      image: course.imageUrl || "/default-course.jpg",
      instructor: course.instructor,
      duration: `${Number(course.durationWeeks || 0)} Weeks`,
      students: String(Number(course.studentsCount || 0)),
    }));

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}