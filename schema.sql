
CREATE DATABASE IF NOT EXISTS aivora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aivora_db;

-- جدول Role
CREATE TABLE IF NOT EXISTS Role (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(191) UNIQUE NOT NULL
);

-- جدول User
CREATE TABLE IF NOT EXISTS User (
  id VARCHAR(36) PRIMARY KEY,
  roleId VARCHAR(36) NOT NULL,
  fullName VARCHAR(191) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  passwordHash VARCHAR(191) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (roleId) REFERENCES Role(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_roleId (roleId)
);

-- جدول Course
CREATE TABLE IF NOT EXISTS Course (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,               -- ← وصف الكورس المفصل
  teacherId VARCHAR(36) NOT NULL,          -- المدرس الرئيسي (أو المسؤول)
  price DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_teacherId (teacherId)
);

-- جدول Module (شابتر داخل الكورس)
CREATE TABLE IF NOT EXISTS Module (
  id VARCHAR(36) PRIMARY KEY,
  courseId VARCHAR(36) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT,
  orderNumber INT NOT NULL,                -- ترتيب الشابتر (1, 2, 3...)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_order (courseId, orderNumber)
);

-- جدول Lesson (درس داخل الشابتر)
CREATE TABLE IF NOT EXISTS Lesson (
  id VARCHAR(36) PRIMARY KEY,
  moduleId VARCHAR(36) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT,
  content TEXT,                            -- نص الدرس أو markdown
  videoUrl VARCHAR(255),                   -- رابط فيديو (اختياري)
  orderNumber INT NOT NULL,                -- ترتيب الدرس داخل الشابتر
  durationMinutes INT DEFAULT 0,
  isPublished BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (moduleId) REFERENCES Module(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_lesson_order (moduleId, orderNumber)
);

-- جدول Enrollment (تسجيل طالب في كورس)
CREATE TABLE IF NOT EXISTS Enrollment (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  courseId VARCHAR(36) NOT NULL,
  enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
  progressPercentage DECIMAL(5,2) DEFAULT 0.00,   -- تقدم الكورس الكلي
  completedAt DATETIME NULL,

  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_enrollment (studentId, courseId)
);

-- جدول LessonProgress (تقدم الطالب في درس معين)
CREATE TABLE IF NOT EXISTS LessonProgress (
  id VARCHAR(36) PRIMARY KEY,
  enrollmentId VARCHAR(36) NOT NULL,
  lessonId VARCHAR(36) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progressPercentage DECIMAL(5,2) DEFAULT 0.00,   -- تقدم الدرس
  startedAt DATETIME NULL,
  completedAt DATETIME NULL,

  FOREIGN KEY (enrollmentId) REFERENCES Enrollment(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_progress (enrollmentId, lessonId)
);

CREATE TABLE IF NOT EXISTS PasswordResetToken (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- بيانات أولية (اختياري)
INSERT IGNORE INTO Role (id, name) VALUES 
  (UUID(), 'admin'),
  (UUID(), 'teacher'),
  (UUID(), 'student');