import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

let ensurePromise: Promise<void> | null = null;

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
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

export async function ensureCourseEvaluationSchema() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_evaluation (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        rating TINYINT UNSIGNED NULL,
        feedback TEXT NULL COLLATE utf8mb4_unicode_ci,
        skippedAt DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_course_evaluation_student (courseId, studentId),
        INDEX idx_course_evaluation_course (courseId),
        INDEX idx_course_evaluation_rating (rating),
        INDEX idx_course_evaluation_created (createdAt),
        FOREIGN KEY (courseId) REFERENCES course(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (studentId) REFERENCES user(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    if (!(await hasColumn('course_evaluation', 'rating'))) {
      await pool.query(`
        ALTER TABLE course_evaluation
        ADD COLUMN rating TINYINT UNSIGNED NULL AFTER studentId
      `);
    }

    if (!(await hasColumn('course_evaluation', 'feedback'))) {
      await pool.query(`
        ALTER TABLE course_evaluation
        ADD COLUMN feedback TEXT NULL COLLATE utf8mb4_unicode_ci AFTER rating
      `);
    }

    if (!(await hasColumn('course_evaluation', 'skippedAt'))) {
      await pool.query(`
        ALTER TABLE course_evaluation
        ADD COLUMN skippedAt DATETIME NULL AFTER feedback
      `);
    }
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

