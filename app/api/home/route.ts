import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getRequestUser } from "@/lib/request-auth";

export async function GET(req: Request) {
  try {
    const user = await getRequestUser(req);
    const includeEnrollment = user?.role === 'student';

    const enrollmentSelect = includeEnrollment
      ? `, EXISTS(
          SELECT 1
          FROM enrollment e2
          WHERE e2.courseId = c.id AND e2.studentId = ?
        ) AS enrolled`
      : `, 0 AS enrolled`;

    const sql = `
      SELECT
        c.id,
        c.title,
        c.description,
        c.price,
        c.imageUrl,
        c.durationWeeks,
        u.fullName AS instructor,
        COUNT(e.id) AS studentsCount
        ${enrollmentSelect}
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
    `;

    const [rows] = await pool.query<RowDataPacket[]>(
      sql,
      includeEnrollment ? [user?.id] : []
    );

    const courses = rows.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: Number(course.price),
      image: course.imageUrl || "/default-course.jpg",
      instructor: course.instructor,
      duration: `${Number(course.durationWeeks || 0)} Weeks`,
      students: String(Number(course.studentsCount || 0)),
      enrolled: Boolean(course.enrolled),
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
