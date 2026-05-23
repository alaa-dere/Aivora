-- Aivora DB hotfix + latest features sync
-- Safe to run multiple times on MySQL 8+

CREATE DATABASE IF NOT EXISTS aivora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aivora_db;

-- 1) New tables used by latest app pages
CREATE TABLE IF NOT EXISTS job_posting (
  id               VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
  title            VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
  description      TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  requirements     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  responsibilities TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  otherNotes       TEXT NULL COLLATE utf8mb4_unicode_ci,
  status           ENUM('open','closed') DEFAULT 'open',
  createdBy        VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
  createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_posting_status (status),
  INDEX idx_job_posting_created (createdAt),
  CONSTRAINT fk_job_posting_created_by FOREIGN KEY (createdBy)
    REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS instructor_application (
  id               VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
  fullName         VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
  email            VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
  jobPostingId     VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
  phone            VARCHAR(40) NULL COLLATE utf8mb4_unicode_ci,
  bio              TEXT NULL COLLATE utf8mb4_unicode_ci,
  cvFileUrl        VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  status           ENUM('pending','reviewed','accepted','rejected') DEFAULT 'pending',
  reviewedBy       VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
  reviewedAt       DATETIME NULL,
  adminNotes       TEXT NULL COLLATE utf8mb4_unicode_ci,
  createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_instructor_app_status (status),
  INDEX idx_instructor_app_created (createdAt),
  INDEX idx_instructor_app_email (email),
  INDEX idx_instructor_app_job (jobPostingId),
  CONSTRAINT fk_instructor_application_reviewed_by FOREIGN KEY (reviewedBy)
    REFERENCES user(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_instructor_application_job FOREIGN KEY (jobPostingId)
    REFERENCES job_posting(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Keep admin chat schema aligned with latest code
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_teacher_message'
    AND COLUMN_NAME = 'deletedForAdminAt'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE admin_teacher_message ADD COLUMN deletedForAdminAt DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_teacher_message'
    AND COLUMN_NAME = 'deletedForTeacherAt'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE admin_teacher_message ADD COLUMN deletedForTeacherAt DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_teacher_message'
    AND COLUMN_NAME = 'deletedForEveryoneAt'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE admin_teacher_message ADD COLUMN deletedForEveryoneAt DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_teacher_message'
    AND INDEX_NAME = 'idx_admin_teacher_deleted_everyone'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_admin_teacher_deleted_everyone ON admin_teacher_message (deletedForEveryoneAt)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_teacher_message'
    AND INDEX_NAME = 'idx_admin_teacher_deleted_admin'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_admin_teacher_deleted_admin ON admin_teacher_message (deletedForAdminAt)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_teacher_message'
    AND INDEX_NAME = 'idx_admin_teacher_deleted_teacher'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_admin_teacher_deleted_teacher ON admin_teacher_message (deletedForTeacherAt)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Keep notifications enum aligned (supports teacher-message notifications)
ALTER TABLE admin_notification
  MODIFY COLUMN type ENUM('student_signup','course_enroll','teacher_message')
  COLLATE utf8mb4_unicode_ci DEFAULT 'student_signup';

-- 4) Optional: default seed for job postings if table is empty
INSERT INTO job_posting (id, title, description, requirements, responsibilities, otherNotes, status, createdBy)
SELECT
  UUID(),
  'Java Programming Instructor',
  'We are looking for a skilled Java Instructor to join our online education platform and help students learn Java from beginner to advanced levels.',
  '- Strong Java fundamentals and OOP\n- Teaching or mentoring experience\n- Good communication skills',
  '- Deliver live sessions and recorded lessons\n- Prepare assignments and quizzes\n- Support students throughout the course',
  'Part-time, remote-friendly',
  'open',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM job_posting);
