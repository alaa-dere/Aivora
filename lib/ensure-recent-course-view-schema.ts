import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

let ensurePromise: Promise<void> | null = null;

async function hasTable(tableName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      LIMIT 1
    `,
    [tableName]
  );

  return rows.length > 0;
}

export async function ensureRecentCourseViewSchema() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    if (await hasTable('recent_course_view')) return;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS recent_course_view (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        lastViewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_recent_course_view (studentId, courseId),
        INDEX idx_recent_student (studentId),
        INDEX idx_recent_last_viewed (lastViewedAt),
        FOREIGN KEY (studentId) REFERENCES user(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (courseId) REFERENCES course(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}
