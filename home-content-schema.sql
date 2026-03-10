-- Home page dynamic content schema (MySQL 8+)
-- Run this after your base schema.sql

USE aivora_db;

CREATE TABLE IF NOT EXISTS HomePageContent (
    id                  TINYINT PRIMARY KEY,
    heroTitleEn         VARCHAR(255) NOT NULL,
    heroTitleAr         VARCHAR(255) NOT NULL,
    heroDescriptionEn   TEXT NOT NULL,
    heroDescriptionAr   TEXT NOT NULL,
    aboutTitleEn        VARCHAR(255) NOT NULL,
    aboutTitleAr        VARCHAR(255) NOT NULL,
    aboutDescriptionEn  LONGTEXT NOT NULL,
    aboutDescriptionAr  LONGTEXT NOT NULL,
    contactEmail        VARCHAR(255) NOT NULL DEFAULT 'support@aivora.com',
    contactPhone        VARCHAR(80) NOT NULL DEFAULT '+970 599 123 456',
    contactLocationEn   VARCHAR(255) NOT NULL DEFAULT 'Nablus, Palestine',
    contactLocationAr   VARCHAR(255) NOT NULL DEFAULT 'Nablus, Palestine',
    contactDescriptionEn TEXT NOT NULL DEFAULT 'We are here to support your learning journey.',
    contactDescriptionAr TEXT NOT NULL DEFAULT 'We are here to support your learning journey.',
    createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_home_page_singleton CHECK (id = 1)
) ENGINE=InnoDB;

ALTER TABLE HomePageContent
    ADD COLUMN IF NOT EXISTS contactEmail VARCHAR(255) NOT NULL DEFAULT 'support@aivora.com',
    ADD COLUMN IF NOT EXISTS contactPhone VARCHAR(80) NOT NULL DEFAULT '+970 599 123 456',
    ADD COLUMN IF NOT EXISTS contactLocationEn VARCHAR(255) NOT NULL DEFAULT 'Nablus, Palestine',
    ADD COLUMN IF NOT EXISTS contactLocationAr VARCHAR(255) NOT NULL DEFAULT 'Nablus, Palestine',
    ADD COLUMN IF NOT EXISTS contactDescriptionEn TEXT NOT NULL DEFAULT 'We are here to support your learning journey.',
    ADD COLUMN IF NOT EXISTS contactDescriptionAr TEXT NOT NULL DEFAULT 'We are here to support your learning journey.';

CREATE TABLE IF NOT EXISTS HomeFeaturedCourse (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    titleEn         VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
    titleAr         VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
    instructorEn    VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    instructorAr    VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    durationEn      VARCHAR(80) NOT NULL COLLATE utf8mb4_unicode_ci,
    durationAr      VARCHAR(80) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentsTextEn  VARCHAR(80) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentsTextAr  VARCHAR(80) NOT NULL COLLATE utf8mb4_unicode_ci,
    imageUrl        VARCHAR(500) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseLink      VARCHAR(255) DEFAULT '#' COLLATE utf8mb4_unicode_ci,
    price           DECIMAL(10,2) DEFAULT 0.00,
    rating          DECIMAL(2,1) DEFAULT 5.0,
    sortOrder       INT DEFAULT 0,
    isActive        TINYINT(1) DEFAULT 1,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_featured_order (sortOrder, createdAt),
    INDEX idx_featured_active (isActive)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS HomeTestimonial (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    language        ENUM('en', 'ar') NOT NULL,
    fullName        VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    roleTitle       VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    content         TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    avatarUrl       VARCHAR(500) DEFAULT '' COLLATE utf8mb4_unicode_ci,
    rating          DECIMAL(2,1) DEFAULT 5.0,
    sortOrder       INT DEFAULT 0,
    isActive        TINYINT(1) DEFAULT 1,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_testimonial_lang (language, sortOrder),
    INDEX idx_testimonial_active (isActive)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS HomeStudentReview (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    language        ENUM('en', 'ar') NOT NULL,
    studentName     VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    reviewText      TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    courseTitle     VARCHAR(191) DEFAULT '' COLLATE utf8mb4_unicode_ci,
    rating          DECIMAL(2,1) DEFAULT 5.0,
    sortOrder       INT DEFAULT 0,
    isActive        TINYINT(1) DEFAULT 1,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_review_lang (language, sortOrder),
    INDEX idx_review_active (isActive)
) ENGINE=InnoDB;

INSERT INTO HomePageContent (
    id,
    heroTitleEn, heroTitleAr,
    heroDescriptionEn, heroDescriptionAr,
    aboutTitleEn, aboutTitleAr,
    aboutDescriptionEn, aboutDescriptionAr,
    contactEmail, contactPhone,
    contactLocationEn, contactLocationAr,
    contactDescriptionEn, contactDescriptionAr
)
VALUES (
    1,
    'Learn Smarter. Build Faster.',
    'Learn Smarter. Build Faster.',
    'Aivora helps students and professionals master AI and software skills with practical projects.',
    'Aivora helps students and professionals master AI and software skills with practical projects.',
    'About Aivora',
    'About Aivora',
    'A modern learning platform with guided paths, practical assignments, and clear progress tracking.',
    'A modern learning platform with guided paths, practical assignments, and clear progress tracking.',
    'support@aivora.com',
    '+970 599 123 456',
    'Nablus, Palestine',
    'Nablus, Palestine',
    'We are here to support your learning journey.',
    'We are here to support your learning journey.'
)
ON DUPLICATE KEY UPDATE id = id;
