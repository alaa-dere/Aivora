import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getRequestUser } from "@/lib/request-auth";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req);
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: studentId } = await params;
    const teacherId = user.id;

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT u.id, u.fullName, u.email, u.imageUrl, u.status, u.createdAt, u.updatedAt
      FROM user u
      JOIN enrollment e ON e.studentId = u.id
      JOIN course c ON c.id = e.courseId
      WHERE u.id = ? AND c.teacherId = ?
      GROUP BY u.id
      LIMIT 1
      `,
      [studentId, teacherId]
    );

    if (studentRows.length === 0) {
      return NextResponse.json({ message: "Student not found in your courses" }, { status: 404 });
    }

    const student = studentRows[0];

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        e.id AS enrollmentId,
        c.id AS courseId,
        c.title,
        e.status,
        e.progressPercentage,
        e.enrolledAt,
        e.completedAt,
        c.price,
        (
          SELECT COALESCE(AVG(a.scorePercentage), 0)
          FROM course_quiz_attempt a
          WHERE a.courseId = c.id AND a.studentId = e.studentId
        ) AS finalQuizAvg,
        (
          SELECT COUNT(*)
          FROM course_quiz_attempt a
          WHERE a.courseId = c.id AND a.studentId = e.studentId
        ) AS finalQuizCount,
        (
          SELECT COALESCE(AVG(a.scorePercentage), 0)
          FROM lesson_quiz_attempt a
          WHERE a.courseId = c.id AND a.studentId = e.studentId
        ) AS chapterQuizAvg,
        (
          SELECT COUNT(*)
          FROM lesson_quiz_attempt a
          WHERE a.courseId = c.id AND a.studentId = e.studentId
        ) AS chapterQuizCount,
        (
          SELECT COUNT(*)
          FROM course_quiz_attempt a
          WHERE a.courseId = c.id AND a.studentId = e.studentId
        ) AS quizAttempts,
        (
          SELECT COALESCE(m.missedCount, 0)
          FROM student_live_miss m
          WHERE m.studentId = e.studentId AND m.courseId = e.courseId
          LIMIT 1
        ) AS missedSessions,
        (
          SELECT COUNT(*)
          FROM live_session s
          WHERE s.courseId = e.courseId
        ) AS totalSessions,
        (
          SELECT COUNT(*)
          FROM live_session_attendance lsa
          JOIN live_session s ON s.id = lsa.sessionId
          WHERE s.courseId = e.courseId
            AND lsa.studentId = e.studentId
            AND lsa.attended = 1
        ) AS attendedSessions,
        cert.id AS certificateId
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      LEFT JOIN certificate cert
        ON cert.studentId = e.studentId
       AND cert.courseId = e.courseId
      WHERE e.studentId = ?
        AND c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      `,
      [studentId, teacherId]
    );

    const [statsRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        COUNT(*) AS totalEnrollments,
        COUNT(DISTINCT e.courseId) AS totalCourses,
        SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedCourses,
        AVG(e.progressPercentage) AS avgProgress,
        MAX(e.enrolledAt) AS lastEnrollmentDate,
        COALESCE(SUM(c.price), 0) AS totalCourseValue
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      WHERE e.studentId = ?
        AND c.teacherId = ?
      `,
      [studentId, teacherId]
    );

    const [aiRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        COALESCE(AVG(e.progressPercentage), 0) AS avgProgress,
        COALESCE(
          (
            SELECT AVG(a.scorePercentage)
            FROM course_quiz_attempt a
            JOIN course c2 ON c2.id = a.courseId
            WHERE a.studentId = ? AND c2.teacherId = ?
          ),
          0
        ) AS finalQuizAvg,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM course_quiz_attempt a
            JOIN course c2 ON c2.id = a.courseId
            WHERE a.studentId = ? AND c2.teacherId = ?
          ),
          0
        ) AS finalQuizCount,
        COALESCE(
          (
            SELECT AVG(a.scorePercentage)
            FROM lesson_quiz_attempt a
            JOIN lesson l ON l.id = a.lessonId
            JOIN course c3 ON c3.id = l.courseId
            WHERE a.studentId = ? AND c3.teacherId = ?
          ),
          0
        ) AS chapterQuizAvg,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM lesson_quiz_attempt a
            JOIN lesson l ON l.id = a.lessonId
            JOIN course c3 ON c3.id = l.courseId
            WHERE a.studentId = ? AND c3.teacherId = ?
          ),
          0
        ) AS chapterQuizCount,
        COALESCE(MAX(sm.missedCount), 0) AS maxMissedSessions
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      LEFT JOIN student_live_miss sm
        ON sm.courseId = e.courseId
       AND sm.studentId = e.studentId
      WHERE e.studentId = ?
        AND c.teacherId = ?
      `,
      [studentId, teacherId, studentId, teacherId, studentId, teacherId, studentId, teacherId, studentId, teacherId]
    );

    const [timelineRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT * FROM (
        SELECT
          e.enrolledAt AS eventAt,
          'enrollment' AS eventType,
          CONCAT('Enrolled in ', c.title) AS eventTitle,
          CONCAT('Current progress: ', ROUND(e.progressPercentage), '%') AS eventMeta
        FROM enrollment e
        JOIN course c ON c.id = e.courseId
        WHERE e.studentId = ? AND c.teacherId = ?

        UNION ALL

        SELECT
          qa.submittedAt AS eventAt,
          'quiz' AS eventType,
          CONCAT('Quiz submitted in ', c.title) AS eventTitle,
          CONCAT('Score: ', ROUND(qa.scorePercentage), '%') AS eventMeta
        FROM course_quiz_attempt qa
        JOIN course c ON c.id = qa.courseId
        WHERE qa.studentId = ? AND c.teacherId = ?

        UNION ALL

        SELECT
          cert.issuedAt AS eventAt,
          'certificate' AS eventType,
          CONCAT('Certificate earned in ', c.title) AS eventTitle,
          cert.certificateNo AS eventMeta
        FROM certificate cert
        JOIN course c ON c.id = cert.courseId
        WHERE cert.studentId = ? AND c.teacherId = ?
      ) t
      ORDER BY t.eventAt DESC
      LIMIT 20
      `,
      [studentId, teacherId, studentId, teacherId, studentId, teacherId]
    );

    const baseStats = statsRows[0] || {};
    const aiBase = aiRows[0] || {};

    const aiProgressPenalty = clamp((60 - Number(aiBase.avgProgress || 0)) * 0.8, 0, 40);
    const aiFinalQuizAvg = Number(aiBase.finalQuizAvg || 0);
    const aiFinalQuizCount = Number(aiBase.finalQuizCount || 0);
    const aiChapterQuizAvg = Number(aiBase.chapterQuizAvg || 0);
    const aiChapterQuizCount = Number(aiBase.chapterQuizCount || 0);
    const aiQuizAttempts = aiFinalQuizCount + aiChapterQuizCount;
    const aiAvgQuizScore =
      aiQuizAttempts > 0
        ? (aiFinalQuizAvg * aiFinalQuizCount + aiChapterQuizAvg * aiChapterQuizCount) / aiQuizAttempts
        : 0;
    const aiQuizPenalty = clamp((70 - aiAvgQuizScore) * 0.5, 0, 25);
    const aiAttendancePenalty = clamp(Number(aiBase.maxMissedSessions || 0) * 6, 0, 35);
    const riskScore = Math.round(clamp(aiProgressPenalty + aiQuizPenalty + aiAttendancePenalty, 0, 100));
    const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

    return NextResponse.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        imageUrl: student.imageUrl || null,
        status: student.status || "active",
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
      stats: {
        totalCourses: Number(baseStats.totalCourses || 0),
        totalEnrollments: Number(baseStats.totalEnrollments || 0),
        completedCourses: Number(baseStats.completedCourses || 0),
        avgProgress: Number(baseStats.avgProgress || 0),
        lastEnrollmentDate: baseStats.lastEnrollmentDate || null,
        totalCourseValue: Number(baseStats.totalCourseValue || 0),
        certificatesCount: courseRows.filter((row) => row.certificateId).length,
      },
      courses: courseRows.map((row) => ({
        enrollmentId: row.enrollmentId,
        courseId: row.courseId,
        title: row.title,
        status: row.status || "enrolled",
        progressPercentage: Number(row.progressPercentage || 0),
        enrolledAt: row.enrolledAt,
        completedAt: row.completedAt || null,
        price: Number(row.price || 0),
        avgQuizScore:
          Number(row.finalQuizCount || 0) + Number(row.chapterQuizCount || 0) > 0
            ? (Number(row.finalQuizAvg || 0) * Number(row.finalQuizCount || 0) +
                Number(row.chapterQuizAvg || 0) * Number(row.chapterQuizCount || 0)) /
              (Number(row.finalQuizCount || 0) + Number(row.chapterQuizCount || 0))
            : 0,
        quizAttempts: Number(row.quizAttempts || 0),
        missedSessions: Number(row.missedSessions || 0),
        attendedSessions: Number(row.attendedSessions || 0),
        totalSessions: Number(row.totalSessions || 0),
        certificateId: row.certificateId || null,
      })),
      aiRisk: {
        score: riskScore,
        level: riskLevel,
        factors: {
          avgProgress: Number(aiBase.avgProgress || 0),
          avgQuizScore: aiAvgQuizScore,
          maxMissedSessions: Number(aiBase.maxMissedSessions || 0),
        },
      },
      timeline: timelineRows.map((row) => ({
        eventAt: row.eventAt,
        eventType: row.eventType,
        eventTitle: row.eventTitle,
        eventMeta: row.eventMeta,
      })),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Teacher student details error:", error);
    return NextResponse.json(
      { message: "Failed to load student details", error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
