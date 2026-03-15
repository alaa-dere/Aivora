CREATE DATABASE IF NOT EXISTS aivora_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE aivora_db;

-- جدول Role
CREATE TABLE IF NOT EXISTS Role (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    name        VARCHAR(191) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB;

-- جدول User
CREATE TABLE IF NOT EXISTS User (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    roleId          VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    fullName        VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    email           VARCHAR(191) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
    passwordHash    VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    status          ENUM('active', 'inactive') DEFAULT 'active',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (roleId) REFERENCES Role(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_roleId (roleId)
) ENGINE=InnoDB;

-- جدول Course
CREATE TABLE IF NOT EXISTS Course (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    imageUrl        VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    durationWeeks   INT DEFAULT 0,
    teacherId       VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    price           DECIMAL(10,2) DEFAULT 0.00,
    teacherSharePct DECIMAL(5,2) DEFAULT 70.00 
        COMMENT 'نسبة حصة المدرس من سعر الكورس (مثلاً 60 = 60%)',
    status          ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (teacherId) REFERENCES User(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_teacherId (teacherId)
) ENGINE=InnoDB;

-- جدول Module
CREATE TABLE IF NOT EXISTS Module (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT COLLATE utf8mb4_unicode_ci,
    orderNumber     INT NOT NULL,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (courseId) REFERENCES Course(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_order (courseId, orderNumber),
    INDEX idx_courseId (courseId)
) ENGINE=InnoDB;

-- جدول Lesson
CREATE TABLE IF NOT EXISTS Lesson (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    moduleId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT COLLATE utf8mb4_unicode_ci,
    content         TEXT COLLATE utf8mb4_unicode_ci,
    codeContent     TEXT COLLATE utf8mb4_unicode_ci,
    videoUrl        VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    type            ENUM('text', 'code_example', 'live_python', 'video_embed', 'quiz', 'mixed') DEFAULT 'text',
    enableLiveEditor BOOLEAN DEFAULT FALSE,
    orderNumber     INT NOT NULL,
    durationMinutes INT DEFAULT 0,
    isPublished     BOOLEAN DEFAULT FALSE,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (moduleId) REFERENCES Module(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_lesson_order (moduleId, orderNumber),
    INDEX idx_moduleId (moduleId)
) ENGINE=InnoDB;

-- جدول Enrollment
CREATE TABLE IF NOT EXISTS Enrollment (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    studentId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId            VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    enrolledAt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    progressPercentage  DECIMAL(5,2) DEFAULT 0.00,
    completedAt         DATETIME NULL,

    FOREIGN KEY (studentId) REFERENCES User(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES Course(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_enrollment (studentId, courseId),
    INDEX idx_studentId (studentId),
    INDEX idx_courseId  (courseId)
) ENGINE=InnoDB;

-- جدول LessonProgress
CREATE TABLE IF NOT EXISTS LessonProgress (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    enrollmentId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    lessonId            VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    completed           BOOLEAN DEFAULT FALSE,
    progressPercentage  DECIMAL(5,2) DEFAULT 0.00,
    startedAt           DATETIME NULL,
    completedAt         DATETIME NULL,

    FOREIGN KEY (enrollmentId) REFERENCES Enrollment(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (lessonId) REFERENCES Lesson(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_progress (enrollmentId, lessonId),
    INDEX idx_enrollmentId (enrollmentId),
    INDEX idx_lessonId     (lessonId)
) ENGINE=InnoDB;

-- جدول PasswordResetToken
CREATE TABLE IF NOT EXISTS PasswordResetToken (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    userId      VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    token       VARCHAR(255) NOT NULL UNIQUE COLLATE utf8mb4_unicode_ci,
    expiresAt   DATETIME NOT NULL,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES User(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_token (token)
) ENGINE=InnoDB;

-- بيانات أولية (اختياري)
INSERT IGNORE INTO Role (id, name) VALUES 
    (UUID(), 'admin'),
    (UUID(), 'teacher'),
    (UUID(), 'student');
