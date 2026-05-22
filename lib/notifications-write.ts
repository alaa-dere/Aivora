import pool from '@/lib/db';
import { hasUnifiedNotificationTable } from '@/lib/notifications-unified';

type AdminNotificationInput = {
  type: string;
  title: string;
  message: string;
  studentId?: string | null;
  courseId?: string | null;
};

type StudentNotificationInput = {
  studentId: string;
  type: string;
  title: string;
  message: string;
  courseId?: string | null;
  teacherId?: string | null;
};

type TeacherNotificationInput = {
  teacherId: string;
  type: string;
  title: string;
  message: string;
  courseId?: string | null;
  studentId?: string | null;
};

export async function createAdminNotification(input: AdminNotificationInput) {
  const isUnified = await hasUnifiedNotificationTable();
  if (isUnified) {
    await pool.query(
      `
      INSERT INTO notification
        (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt, deletedAt)
      VALUES
        (UUID(), 'admin', 'admin', ?, ?, ?, ?, ?, NULL, NULL, NOW(), NULL, NULL)
      `,
      [input.type, input.title, input.message, input.studentId || null, input.courseId || null]
    );
    return;
  }

  const legacyType =
    input.type === 'teacher_message' || input.type === 'student_signup'
      ? input.type
      : 'course_enroll';

  await pool.query(
    `
    INSERT INTO admin_notification
      (id, type, title, message, studentId, courseId, createdAt, readAt)
    VALUES
      (UUID(), ?, ?, ?, ?, ?, NOW(), NULL)
    `,
    [legacyType, input.title, input.message, input.studentId || null, input.courseId || null]
  );
}

export async function createStudentNotification(input: StudentNotificationInput) {
  if (await hasUnifiedNotificationTable()) {
    await pool.query(
      `
      INSERT INTO notification
        (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt, deletedAt)
      VALUES
        (UUID(), ?, 'student', ?, ?, ?, ?, ?, NULL, NULL, NOW(), NULL, NULL)
      `,
      [
        input.studentId,
        input.type,
        input.title,
        input.message,
        input.teacherId || null,
        input.courseId || null,
      ]
    );
    return;
  }

  await pool.query(
    `
    INSERT INTO student_notification
      (id, studentId, courseId, type, title, message, createdAt, readAt)
    VALUES
      (UUID(), ?, ?, ?, ?, ?, NOW(), NULL)
    `,
    [input.studentId, input.courseId || null, input.type, input.title, input.message]
  );
}

export async function createTeacherNotification(input: TeacherNotificationInput) {
  if (await hasUnifiedNotificationTable()) {
    await pool.query(
      `
      INSERT INTO notification
        (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt, deletedAt)
      VALUES
        (UUID(), ?, 'teacher', ?, ?, ?, ?, ?, NULL, NULL, NOW(), NULL, NULL)
      `,
      [
        input.teacherId,
        input.type,
        input.title,
        input.message,
        input.studentId || null,
        input.courseId || null,
      ]
    );
    return;
  }

  await pool.query(
    `
    INSERT INTO teacher_notification
      (id, teacherId, studentId, courseId, type, title, message, createdAt, readAt)
    VALUES
      (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NULL)
    `,
    [
      input.teacherId,
      input.studentId || null,
      input.courseId || null,
      input.type,
      input.title,
      input.message,
    ]
  );
}
