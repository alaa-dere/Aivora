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

export async function ensureLearningPathSchema() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS category (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        name VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
        description TEXT NULL COLLATE utf8mb4_unicode_ci,
        status ENUM('active', 'inactive') DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_category_name (name),
        INDEX idx_category_status (status)
      ) ENGINE=InnoDB
    `);

    if (!(await hasColumn('category', 'description'))) {
      await pool.query(`
        ALTER TABLE category
        ADD COLUMN description TEXT NULL COLLATE utf8mb4_unicode_ci AFTER name
      `);
    }

    if (!(await hasColumn('category', 'status'))) {
      await pool.query(`
        ALTER TABLE category
        ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER description
      `);
    }

    if (!(await hasColumn('category', 'createdAt'))) {
      await pool.query(`
        ALTER TABLE category
        ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP AFTER status
      `);
    }

    if (!(await hasColumn('category', 'updatedAt'))) {
      await pool.query(`
        ALTER TABLE category
        ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt
      `);
    }

    if (!(await hasColumn('course', 'categoryId'))) {
      await pool.query(`
        ALTER TABLE course
        ADD COLUMN categoryId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_path (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        categoryId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
        title VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
        description TEXT NULL COLLATE utf8mb4_unicode_ci,
        level ENUM('beginner', 'intermediate', 'advanced', 'all_levels') DEFAULT 'beginner',
        price DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        estimatedHours INT DEFAULT 0,
        createdBy VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_learning_path_category (categoryId),
        INDEX idx_learning_path_status (status)
      ) ENGINE=InnoDB
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_path_course (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        pathId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        courseId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        orderNumber INT NOT NULL,
        isRequired TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_path_course (pathId, courseId),
        UNIQUE KEY unique_path_order (pathId, orderNumber),
        INDEX idx_learning_path_course_path (pathId),
        INDEX idx_learning_path_course_course (courseId)
      ) ENGINE=InnoDB
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS path_enrollment (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        pathId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
        progressPercentage DECIMAL(5,2) DEFAULT 0.00,
        completedAt DATETIME NULL,
        UNIQUE KEY unique_path_enrollment (pathId, studentId),
        INDEX idx_path_enrollment_path (pathId),
        INDEX idx_path_enrollment_student (studentId)
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
