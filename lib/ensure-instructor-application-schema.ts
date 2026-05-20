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

export async function ensureInstructorApplicationSchema() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_posting (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
        description TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
        requirements TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
        responsibilities TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
        otherNotes TEXT NULL COLLATE utf8mb4_unicode_ci,
        status ENUM('open', 'closed') DEFAULT 'open',
        createdBy VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_job_posting_status (status),
        INDEX idx_job_posting_created (createdAt),
        FOREIGN KEY (createdBy) REFERENCES user(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    if (!(await hasColumn('job_posting', 'responsibilities'))) {
      await pool.query(`
        ALTER TABLE job_posting
        ADD COLUMN responsibilities TEXT NULL COLLATE utf8mb4_unicode_ci AFTER requirements
      `);
      await pool.query(`UPDATE job_posting SET responsibilities = COALESCE(responsibilities, '')`);
      await pool.query(`
        ALTER TABLE job_posting
        MODIFY COLUMN responsibilities TEXT NOT NULL COLLATE utf8mb4_unicode_ci
      `);
    }

    if (!(await hasColumn('job_posting', 'otherNotes'))) {
      await pool.query(`
        ALTER TABLE job_posting
        ADD COLUMN otherNotes TEXT NULL COLLATE utf8mb4_unicode_ci AFTER responsibilities
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS instructor_application (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        fullName VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
        email VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
        jobPostingId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
        phone VARCHAR(40) NULL COLLATE utf8mb4_unicode_ci,
        bio TEXT NULL COLLATE utf8mb4_unicode_ci,
        cvFileUrl VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
        status ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
        reviewedBy VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
        reviewedAt DATETIME NULL,
        adminNotes TEXT NULL COLLATE utf8mb4_unicode_ci,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_instructor_app_status (status),
        INDEX idx_instructor_app_created (createdAt),
        INDEX idx_instructor_app_email (email),
        INDEX idx_instructor_app_job (jobPostingId),
        FOREIGN KEY (jobPostingId) REFERENCES job_posting(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (reviewedBy) REFERENCES user(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    if (!(await hasColumn('instructor_application', 'jobPostingId'))) {
      await pool.query(`
        ALTER TABLE instructor_application
        ADD COLUMN jobPostingId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci AFTER email
      `);
      await pool.query(`
        ALTER TABLE instructor_application
        ADD INDEX idx_instructor_app_job (jobPostingId)
      `);
      await pool.query(`
        ALTER TABLE instructor_application
        ADD CONSTRAINT fk_instructor_app_job
        FOREIGN KEY (jobPostingId) REFERENCES job_posting(id)
        ON DELETE SET NULL ON UPDATE CASCADE
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
