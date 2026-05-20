CREATE TABLE IF NOT EXISTS category (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    name            VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT NULL COLLATE utf8mb4_unicode_ci,
    status          ENUM('active', 'inactive') DEFAULT 'active',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_category_name (name),
    INDEX idx_category_status (status)
) ENGINE=InnoDB;

SET @category_col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'course'
      AND COLUMN_NAME = 'categoryId'
);
SET @category_col_sql := IF(
    @category_col_exists = 0,
    'ALTER TABLE course ADD COLUMN categoryId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci AFTER teacherId',
    'SELECT 1'
);
PREPARE stmt_category_col FROM @category_col_sql;
EXECUTE stmt_category_col;
DEALLOCATE PREPARE stmt_category_col;

SET @category_fk_exists := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'course'
      AND CONSTRAINT_NAME = 'fk_course_category'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @category_fk_sql := IF(
    @category_fk_exists = 0,
    'ALTER TABLE course ADD CONSTRAINT fk_course_category FOREIGN KEY (categoryId) REFERENCES category(id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt_category_fk FROM @category_fk_sql;
EXECUTE stmt_category_fk;
DEALLOCATE PREPARE stmt_category_fk;

SET @category_idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'course'
      AND INDEX_NAME = 'idx_categoryId'
);
SET @category_idx_sql := IF(
    @category_idx_exists = 0,
    'ALTER TABLE course ADD INDEX idx_categoryId (categoryId)',
    'SELECT 1'
);
PREPARE stmt_category_idx FROM @category_idx_sql;
EXECUTE stmt_category_idx;
DEALLOCATE PREPARE stmt_category_idx;

CREATE TABLE IF NOT EXISTS learning_path (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    categoryId          VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    title               VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description         TEXT NULL COLLATE utf8mb4_unicode_ci,
    level               ENUM('beginner', 'intermediate', 'advanced', 'all_levels') DEFAULT 'beginner',
    price               DECIMAL(10,2) DEFAULT 0.00,
    status              ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    estimatedHours      INT DEFAULT 0,
    createdBy           VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (categoryId) REFERENCES category(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_learning_path_category (categoryId),
    INDEX idx_learning_path_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_path_course (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    pathId          VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    orderNumber     INT NOT NULL,
    isRequired      TINYINT(1) DEFAULT 1,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pathId) REFERENCES learning_path(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_path_course (pathId, courseId),
    UNIQUE KEY unique_path_order (pathId, orderNumber),
    INDEX idx_learning_path_course_path (pathId),
    INDEX idx_learning_path_course_course (courseId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS path_enrollment (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    pathId              VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    enrolledAt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    progressPercentage  DECIMAL(5,2) DEFAULT 0.00,
    completedAt         DATETIME NULL,

    FOREIGN KEY (pathId) REFERENCES learning_path(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_path_enrollment (pathId, studentId),
    INDEX idx_path_enrollment_path (pathId),
    INDEX idx_path_enrollment_student (studentId)
) ENGINE=InnoDB;
