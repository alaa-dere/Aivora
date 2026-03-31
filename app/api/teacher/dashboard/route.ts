import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { randomUUID } from 'crypto';

async function hasColumn(tableName: string, columnName: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function ensureAdminTeacherDeleteColumns() {
  const exists = await hasColumn('admin_teacher_message', 'deletedForEveryoneAt');
  if (exists) return;
  try {
    await pool.query(`
      ALTER TABLE admin_teacher_message
      ADD COLUMN deletedForAdminAt DATETIME NULL,
      ADD COLUMN deletedForTeacherAt DATETIME NULL,
      ADD COLUMN deletedForEveryoneAt DATETIME NULL,
      ADD INDEX idx_admin_teacher_deleted_everyone (deletedForEveryoneAt),
      ADD INDEX idx_admin_teacher_deleted_admin (deletedForAdminAt),
      ADD INDEX idx_admin_teacher_deleted_teacher (deletedForTeacherAt)
    `);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code !== 'ER_DUP_FIELDNAME' && code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }
}

async function ensureChatDeleteColumns() {
  const exists = await hasColumn('chat_message', 'deletedForEveryoneAt');
  if (exists) return;
  try {
    await pool.query(`
      ALTER TABLE chat_message
      ADD COLUMN deletedForStudentAt DATETIME NULL,
      ADD COLUMN deletedForTeacherAt DATETIME NULL,
      ADD COLUMN deletedForEveryoneAt DATETIME NULL,
      ADD INDEX idx_chat_deleted_everyone (deletedForEveryoneAt),
      ADD INDEX idx_chat_deleted_student (deletedForStudentAt),
      ADD INDEX idx_chat_deleted_teacher (deletedForTeacherAt)
    `);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code !== 'ER_DUP_FIELDNAME' && code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }
}

async function ensureLiveSessionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS live_session (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      teacherId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
      description TEXT NULL COLLATE utf8mb4_unicode_ci,
      startAt DATETIME NOT NULL,
      endAt DATETIME NOT NULL,
      meetingLink VARCHAR(512) NULL COLLATE utf8mb4_unicode_ci,
      status ENUM('scheduled', 'completed') DEFAULT 'scheduled',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_live_teacher (teacherId),
      INDEX idx_live_course (courseId),
      INDEX idx_live_start (startAt),
      FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS live_session_attendance (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      sessionId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      attended TINYINT(1) DEFAULT 0,
      markedAt DATETIME NULL,
      UNIQUE KEY unique_session_student (sessionId, studentId),
      INDEX idx_att_session (sessionId),
      INDEX idx_att_student (studentId),
      FOREIGN KEY (sessionId) REFERENCES live_session(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_notification (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
      type ENUM('live_session', 'missed_session', 'course_failed') DEFAULT 'live_session',
      title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
      message TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      readAt DATETIME NULL,
      INDEX idx_student_notif_student (studentId),
      INDEX idx_student_notif_course (courseId),
      INDEX idx_student_notif_type (type),
      INDEX idx_student_notif_read (readAt),
      FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_live_miss (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      missedCount INT DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_student_course (studentId, courseId),
      INDEX idx_miss_student (studentId),
      INDEX idx_miss_course (courseId),
      FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureAdminTeacherDeleteColumns();
    await ensureChatDeleteColumns();
    await ensureLiveSessionTables();
    const teacherId = user.id;
    const { searchParams } = new URL(req.url);
    const notifications = searchParams.get('notifications');
    const liveSessions = searchParams.get('liveSessions');
    const hasAdminDeleteVisibility = await hasColumn(
      'admin_teacher_message',
      'deletedForEveryoneAt'
    );
    const hasChatDeleteVisibility = await hasColumn('chat_message', 'deletedForEveryoneAt');

    if (notifications) {
      if (notifications === 'count') {
        const [countRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM enrollment e
          JOIN course c ON c.id = e.courseId
          WHERE c.teacherId = ?
            AND e.enrolledAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          `,
          [teacherId]
        );
        const [messageRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM admin_teacher_message m
          JOIN admin_teacher_thread t ON t.id = m.threadId
          WHERE t.teacherId = ?
            AND m.senderRole = 'admin'
            AND m.readAt IS NULL
            ${hasAdminDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
          `,
          [teacherId]
        );
        const [studentMessageRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS total
          FROM chat_message m
          JOIN chat_conversation c ON c.id = m.conversationId
          WHERE c.teacherId = ?
            AND m.senderRole = 'student'
            AND m.readAt IS NULL
            ${hasChatDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
          `,
          [teacherId]
        );

        const enrollmentCount = Number(countRows[0]?.total || 0);
        const messageCount = Number(messageRows[0]?.total || 0);
        const studentMessageCount = Number(studentMessageRows[0]?.total || 0);
        return NextResponse.json({ total: enrollmentCount + messageCount + studentMessageCount });
      }

      const limit = notifications === 'all' ? 100 : 5;
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          e.id,
          e.enrolledAt,
          s.fullName AS studentName,
          c.title AS courseTitle
        FROM enrollment e
        JOIN course c ON c.id = e.courseId
        JOIN user s ON s.id = e.studentId
        WHERE c.teacherId = ?
        ORDER BY e.enrolledAt DESC
        LIMIT ${limit}
        `,
        [teacherId]
      );

      const [adminMessageRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          m.id,
          m.body,
          m.createdAt,
          m.readAt,
          u.fullName AS adminName
        FROM admin_teacher_message m
        JOIN admin_teacher_thread t ON t.id = m.threadId
        JOIN user u ON u.id = t.adminId
        WHERE t.teacherId = ?
          AND m.senderRole = 'admin'
          ${hasAdminDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
        ORDER BY m.createdAt DESC
        LIMIT ${limit}
        `,
        [teacherId]
      );
      const [studentMessageRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          m.id,
          m.body,
          m.createdAt,
          m.readAt,
          conv.id AS conversationId,
          s.fullName AS studentName,
          c.title AS courseTitle
        FROM chat_message m
        JOIN chat_conversation conv ON conv.id = m.conversationId
        JOIN user s ON s.id = conv.studentId
        JOIN course c ON c.id = conv.courseId
        WHERE conv.teacherId = ?
          AND m.senderRole = 'student'
          ${hasChatDeleteVisibility ? 'AND m.deletedForEveryoneAt IS NULL AND m.deletedForTeacherAt IS NULL' : ''}
        ORDER BY m.createdAt DESC
        LIMIT ${limit}
        `,
        [teacherId]
      );

      const enrollmentItems = rows.map((row) => ({
        id: row.id,
        type: 'course_enroll',
        title: 'New enrollment',
        message: `${row.studentName} enrolled in ${row.courseTitle}`,
        createdAt: row.enrolledAt,
        read: false,
      }));

      const messageItems = adminMessageRows.map((row) => ({
        id: row.id,
        type: 'admin_message',
        title: `Message from ${row.adminName || 'Admin'}`,
        message: row.body,
        createdAt: row.createdAt,
        read: Boolean(row.readAt),
      }));
      const studentMessageItems = studentMessageRows.map((row) => ({
        id: row.id,
        type: 'student_message',
        title: `Message from ${row.studentName || 'Student'}`,
        message: row.body,
        createdAt: row.createdAt,
        read: Boolean(row.readAt),
        conversationId: row.conversationId,
      }));

      const items = [...enrollmentItems, ...messageItems, ...studentMessageItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return NextResponse.json({ notifications: items });
    }

    if (liveSessions) {
      const sessionId = (searchParams.get('sessionId') || '').trim();

      if (sessionId) {
        const [sessionRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT s.id, s.courseId, s.title, s.description, s.startAt, s.endAt, s.meetingLink, s.status,
                 c.title AS courseTitle
          FROM live_session s
          JOIN course c ON c.id = s.courseId
          WHERE s.id = ? AND s.teacherId = ?
          LIMIT 1
          `,
          [sessionId, teacherId]
        );
        if (sessionRows.length === 0) {
          return NextResponse.json({ message: 'Session not found' }, { status: 404 });
        }
        const session = sessionRows[0];

        const [studentRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT
            u.id,
            u.fullName,
            e.status,
            COALESCE(a.attended, 0) AS attended,
            COALESCE(m.missedCount, 0) AS missedCount
          FROM enrollment e
          JOIN user u ON u.id = e.studentId
          LEFT JOIN live_session_attendance a
            ON a.sessionId = ? AND a.studentId = e.studentId
          LEFT JOIN student_live_miss m
            ON m.studentId = e.studentId AND m.courseId = e.courseId
          WHERE e.courseId = ?
            AND e.status IN ('enrolled', 'in_progress', 'completed')
          ORDER BY u.fullName
          `,
          [sessionId, session.courseId]
        );

        return NextResponse.json({
          session,
          students: studentRows.map((row) => ({
            id: row.id,
            name: row.fullName,
            status: row.status,
            attended: Boolean(row.attended),
            missedCount: Number(row.missedCount || 0),
          })),
        });
      }

      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          s.id,
          s.courseId,
          s.title,
          s.description,
          s.startAt,
          s.endAt,
          s.meetingLink,
          s.status,
          c.title AS courseTitle,
          (
            SELECT COUNT(*) FROM enrollment e
            WHERE e.courseId = s.courseId
              AND e.status IN ('enrolled', 'in_progress', 'completed')
          ) AS totalStudents,
          (
            SELECT COUNT(*) FROM live_session_attendance a
            WHERE a.sessionId = s.id AND a.attended = 1
          ) AS attendees
        FROM live_session s
        JOIN course c ON c.id = s.courseId
        WHERE s.teacherId = ?
        ORDER BY s.startAt DESC
        LIMIT 200
        `,
        [teacherId]
      );

      return NextResponse.json({
        sessions: rows.map((row) => ({
          id: row.id,
          courseId: row.courseId,
          title: row.title,
          description: row.description,
          startAt: row.startAt,
          endAt: row.endAt,
          meetingLink: row.meetingLink,
          status: row.status,
          courseTitle: row.courseTitle,
          totalStudents: Number(row.totalStudents || 0),
          attendees: Number(row.attendees || 0),
        })),
      });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, status
      FROM course
      WHERE teacherId = ?
      `,
      [teacherId]
    );

    const courseIds = courseRows.map((row) => row.id as string);
    const activeCourses = courseRows.filter((row) => row.status === 'published').length;

    let totalStudents = 0;
    let avgProgress = 0;

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const [studentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(DISTINCT studentId) AS totalStudents,
               AVG(progressPercentage) AS avgProgress
        FROM enrollment
        WHERE courseId IN (${placeholders})
        `,
        courseIds
      );
      totalStudents = Number(studentRows[0]?.totalStudents || 0);
      avgProgress = Number(studentRows[0]?.avgProgress || 0);
    }

    const stats = {
      totalStudents,
      activeCourses,
      avgScore: Math.round(avgProgress),
      completion: Math.round(avgProgress),
    };

    const [coursesList] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c.id,
        c.title,
        c.status,
        c.description,
        (
          SELECT COUNT(*) FROM enrollment e WHERE e.courseId = c.id
        ) AS students,
        (
          SELECT COUNT(*) FROM module m WHERE m.courseId = c.id
        ) AS modules,
        (
          SELECT COUNT(*) 
          FROM lesson l 
          JOIN module m2 ON m2.id = l.moduleId
          WHERE m2.courseId = c.id
        ) AS lessons,
        (
          SELECT AVG(e.progressPercentage) FROM enrollment e WHERE e.courseId = c.id
        ) AS progress
      FROM course c
      WHERE c.teacherId = ?
      ORDER BY c.updatedAt DESC
      LIMIT 4
      `,
      [teacherId]
    );

    const courses = coursesList.map((row) => ({
      id: row.id,
      name: row.title,
      code: row.id,
      students: Number(row.students || 0),
      completion: Math.round(Number(row.progress || 0)),
      averageScore: Math.round(Number(row.progress || 0)),
      status: row.status === 'published' ? 'active' : 'draft',
      description: row.description || '',
    }));

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        u.fullName AS name,
        u.imageUrl AS imageUrl,
        c.title AS courseTitle,
        e.progressPercentage AS progress,
        e.status AS status
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      LIMIT 4
      `,
      [teacherId]
    );

    const students = studentRows.map((row) => {
      const progress = Number(row.progress || 0);
      const status = row.status || (progress >= 100 ? 'completed' : 'in_progress');
      const normalizedStatus =
        progress >= 100 || status === 'completed' ? 'completed' : status;

      return ({
      name: row.name,
      courseName: row.courseTitle || '',
      imageUrl: row.imageUrl || null,
      avatar: (row.name || '?')
        .split(' ')
        .map((part: string) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      progress: Math.round(progress),
      status: normalizedStatus,
      });
    });

    const [activityRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        u.fullName AS studentName,
        c.title AS courseTitle,
        e.enrolledAt AS time
      FROM enrollment e
      JOIN course c ON c.id = e.courseId
      JOIN user u ON u.id = e.studentId
      WHERE c.teacherId = ?
      ORDER BY e.enrolledAt DESC
      LIMIT 3
      `,
      [teacherId]
    );

    const recentActivities = activityRows.map((row) => ({
      type: 'ENROLL',
      description: `${row.studentName} enrolled in ${row.courseTitle}`,
      time: new Date(row.time).toLocaleString('en-US'),
    }));

    return NextResponse.json({
      stats,
      courses,
      students,
      recentActivities,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Teacher dashboard error:', error);
    return NextResponse.json(
      { message: 'Failed to load teacher dashboard', error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureLiveSessionTables();
    const teacherId = user.id;
    const body = await req.json();
    const action = String(body?.action || '');

    const formatDate = (date: Date) => date.toISOString().slice(0, 10);
    const addDays = (dateStr: string, days: number) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return formatDate(d);
    };

    if (action === 'create_session') {
      const courseId = String(body?.courseId || '').trim();
      const title = String(body?.title || '').trim();
      const description = String(body?.description || '').trim();
      const date = String(body?.date || '').trim();
      const startTime = String(body?.startTime || '').trim();
      const endTime = String(body?.endTime || '').trim();
      const meetingLink = String(body?.meetingLink || '').trim();
      const repeatWeekly = Boolean(body?.repeatWeekly);
      const repeatCount = Math.max(1, Math.min(Number(body?.repeatCount || 1), 12));

      if (!courseId || !title || !date || !startTime || !endTime || !meetingLink) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
      }

      const [courseRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, title FROM course WHERE id = ? AND teacherId = ? LIMIT 1`,
        [courseId, teacherId]
      );
      if (courseRows.length === 0) {
        return NextResponse.json({ message: 'Course not found' }, { status: 404 });
      }
      const courseTitle = courseRows[0].title as string;

      const [studentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT studentId
        FROM enrollment
        WHERE courseId = ?
          AND status IN ('enrolled', 'in_progress', 'completed')
        `,
        [courseId]
      );
      const studentIds = studentRows.map((r) => r.studentId as string);

      const sessionsToCreate = repeatWeekly ? repeatCount : 1;
      const createdIds: string[] = [];

      for (let i = 0; i < sessionsToCreate; i++) {
        const sessionDate = addDays(date, i * 7);
        const startAt = `${sessionDate} ${startTime}:00`;
        const endAt = `${sessionDate} ${endTime}:00`;
        const sessionId = randomUUID();

        await pool.query(
          `
          INSERT INTO live_session
            (id, teacherId, courseId, title, description, startAt, endAt, meetingLink, status, createdAt, updatedAt)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW(), NOW())
          `,
          [sessionId, teacherId, courseId, title, description || null, startAt, endAt, meetingLink]
        );

        if (studentIds.length > 0) {
          const attendanceValues = studentIds.map(() => '(?, ?, ?, 0, NULL)').join(',');
          const attendanceParams = studentIds.flatMap((studentId) => [
            randomUUID(),
            sessionId,
            studentId,
          ]);
          await pool.query(
            `
            INSERT INTO live_session_attendance (id, sessionId, studentId, attended, markedAt)
            VALUES ${attendanceValues}
            `,
            attendanceParams
          );

          const notifValues = studentIds.map(() => '(?, ?, ?, ?, ?, ?, NOW(), NULL)').join(',');
          const notifParams = studentIds.flatMap((studentId) => [
            randomUUID(),
            studentId,
            courseId,
            'live_session',
            'Live session scheduled',
            `Live session scheduled for ${courseTitle} on ${sessionDate} at ${startTime}.`,
          ]);
          await pool.query(
            `
            INSERT INTO student_notification
              (id, studentId, courseId, type, title, message, createdAt, readAt)
            VALUES ${notifValues}
            `,
            notifParams
          );
        }

        createdIds.push(sessionId);
      }

      return NextResponse.json({ success: true, sessionIds: createdIds });
    }

    if (action === 'notify_session') {
      const sessionId = String(body?.sessionId || '').trim();
      if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
      }

      const [sessionRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT s.id, s.courseId, s.startAt, s.meetingLink, c.title AS courseTitle
        FROM live_session s
        JOIN course c ON c.id = s.courseId
        WHERE s.id = ? AND s.teacherId = ?
        LIMIT 1
        `,
        [sessionId, teacherId]
      );
      if (sessionRows.length === 0) {
        return NextResponse.json({ message: 'Session not found' }, { status: 404 });
      }
      const session = sessionRows[0];
      const sessionDate = new Date(session.startAt);
      const dateStr = sessionDate.toISOString().slice(0, 10);
      const timeStr = sessionDate.toTimeString().slice(0, 5);

      const [studentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT studentId
        FROM enrollment
        WHERE courseId = ?
          AND status IN ('enrolled', 'in_progress', 'completed')
        `,
        [session.courseId]
      );
      const studentIds = studentRows.map((r) => r.studentId as string);
      if (studentIds.length > 0) {
        const notifValues = studentIds.map(() => '(?, ?, ?, ?, ?, ?, NOW(), NULL)').join(',');
        const notifParams = studentIds.flatMap((studentId) => [
          randomUUID(),
          studentId,
          session.courseId,
          'live_session',
          'Live session reminder',
          `Reminder: live session for ${session.courseTitle} on ${dateStr} at ${timeStr}.`,
        ]);
        await pool.query(
          `
          INSERT INTO student_notification
            (id, studentId, courseId, type, title, message, createdAt, readAt)
          VALUES ${notifValues}
          `,
          notifParams
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'complete_session') {
      const sessionId = String(body?.sessionId || '').trim();
      const attendedIds = Array.isArray(body?.attendedStudentIds)
        ? body.attendedStudentIds.map((id: any) => String(id))
        : [];
      if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
      }

      const [sessionRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT s.id, s.courseId, s.startAt, c.title AS courseTitle
        FROM live_session s
        JOIN course c ON c.id = s.courseId
        WHERE s.id = ? AND s.teacherId = ?
        LIMIT 1
        `,
        [sessionId, teacherId]
      );
      if (sessionRows.length === 0) {
        return NextResponse.json({ message: 'Session not found' }, { status: 404 });
      }
      const session = sessionRows[0];

      const [studentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT studentId
        FROM enrollment
        WHERE courseId = ?
          AND status IN ('enrolled', 'in_progress', 'completed')
        `,
        [session.courseId]
      );
      const studentIds = studentRows.map((r) => r.studentId as string);

      if (studentIds.length > 0) {
        const attendanceValues = studentIds.map(() => '(?, ?, ?, 0, NULL)').join(',');
        const attendanceParams = studentIds.flatMap((studentId) => [
          randomUUID(),
          sessionId,
          studentId,
        ]);
        await pool.query(
          `
          INSERT IGNORE INTO live_session_attendance (id, sessionId, studentId, attended, markedAt)
          VALUES ${attendanceValues}
          `,
          attendanceParams
        );
      }

      await pool.query(
        `UPDATE live_session_attendance SET attended = 0, markedAt = NULL WHERE sessionId = ?`,
        [sessionId]
      );

      if (attendedIds.length > 0) {
        const placeholders = attendedIds.map(() => '?').join(',');
        await pool.query(
          `
          UPDATE live_session_attendance
          SET attended = 1, markedAt = NOW()
          WHERE sessionId = ? AND studentId IN (${placeholders})
          `,
          [sessionId, ...attendedIds]
        );
      }

      await pool.query(
        `UPDATE live_session SET status = 'completed', updatedAt = NOW() WHERE id = ?`,
        [sessionId]
      );

      const [absentRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT studentId
        FROM live_session_attendance
        WHERE sessionId = ? AND attended = 0
        `,
        [sessionId]
      );
      const absentIds = absentRows.map((r) => r.studentId as string);

      if (absentIds.length > 0) {
        const notifValues = absentIds.map(() => '(?, ?, ?, ?, ?, ?, NOW(), NULL)').join(',');
        const notifParams = absentIds.flatMap((studentId) => [
          randomUUID(),
          studentId,
          session.courseId,
          'missed_session',
          'You missed a live session',
          `You missed the live session for ${session.courseTitle}. Please watch the recording.`,
        ]);
        await pool.query(
          `
          INSERT INTO student_notification
            (id, studentId, courseId, type, title, message, createdAt, readAt)
          VALUES ${notifValues}
          `,
          notifParams
        );

        const missValues = absentIds.map(() => '(?, ?, ?, 1, NOW())').join(',');
        const missParams = absentIds.flatMap((studentId) => [
          randomUUID(),
          studentId,
          session.courseId,
        ]);
        await pool.query(
          `
          INSERT INTO student_live_miss
            (id, studentId, courseId, missedCount, updatedAt)
          VALUES ${missValues}
          ON DUPLICATE KEY UPDATE missedCount = missedCount + 1, updatedAt = NOW()
          `,
          missParams
        );

        const placeholders = absentIds.map(() => '?').join(',');
        const [missRows] = await pool.query<RowDataPacket[]>(
          `
          SELECT studentId, missedCount
          FROM student_live_miss
          WHERE courseId = ? AND studentId IN (${placeholders})
          `,
          [session.courseId, ...absentIds]
        );
        const failedIds = missRows
          .filter((row) => Number(row.missedCount || 0) >= 6)
          .map((row) => row.studentId as string);

        if (failedIds.length > 0) {
          const failedPlaceholders = failedIds.map(() => '?').join(',');
          await pool.query(
            `
            UPDATE enrollment
            SET status = 'dropped'
            WHERE courseId = ? AND studentId IN (${failedPlaceholders})
            `,
            [session.courseId, ...failedIds]
          );

          const failValues = failedIds.map(() => '(?, ?, ?, ?, ?, ?, NOW(), NULL)').join(',');
          const failParams = failedIds.flatMap((studentId) => [
            randomUUID(),
            studentId,
            session.courseId,
            'course_failed',
            'Course failed',
            `You missed 6 live sessions for ${session.courseTitle} and the course was marked as failed.`,
          ]);
          await pool.query(
            `
            INSERT INTO student_notification
              (id, studentId, courseId, type, title, message, createdAt, readAt)
            VALUES ${failValues}
            `,
            failParams
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_session') {
      const sessionId = String(body?.sessionId || '').trim();
      if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
      }

      const [sessionRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM live_session WHERE id = ? AND teacherId = ? LIMIT 1`,
        [sessionId, teacherId]
      );
      if (sessionRows.length === 0) {
        return NextResponse.json({ message: 'Session not found' }, { status: 404 });
      }

      await pool.query(`DELETE FROM live_session WHERE id = ? AND teacherId = ?`, [
        sessionId,
        teacherId,
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('Teacher live sessions error:', error);
    return NextResponse.json(
      { message: 'Failed to process live session', error: error.message },
      { status: 500 }
    );
  }
}
