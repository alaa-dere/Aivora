import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getRequestUser } from "@/lib/request-auth";
import { ensureCourseEvaluationSchema } from "@/lib/ensure-course-evaluation-schema";

export async function GET(req: Request) {
  try {
    await ensureCourseEvaluationSchema();

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
    const [feedbackRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        ce.id,
        ce.rating,
        ce.feedback,
        u.fullName AS studentName,
        c.title AS courseTitle
      FROM course_evaluation ce
      JOIN user u ON u.id = ce.studentId
      JOIN course c ON c.id = ce.courseId
      WHERE ce.rating IS NOT NULL
        AND ce.feedback IS NOT NULL
        AND TRIM(ce.feedback) <> ''
      ORDER BY RAND()
      LIMIT 3
      `
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
    const feedbacks = feedbackRows.map((row) => ({
      id: String(row.id),
      name: String(row.studentName || "Student"),
      role: String(row.courseTitle || "Aivora Student"),
      content: String(row.feedback || ""),
      rating:
        row.rating === null || row.rating === undefined
          ? 0
          : Number(row.rating),
    }));

    return NextResponse.json({
      success: true,
      data: courses,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
