-- schema.sql

CREATE DATABASE IF NOT EXISTS aivora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aivora_db;

-- جدول Role
CREATE TABLE IF NOT EXISTS Role (
  id VARCHAR(36) PRIMARY KEY,   -- ← غيّرنا لـ 36 عشان UUID()
  name VARCHAR(191) UNIQUE NOT NULL
);

-- جدول User
CREATE TABLE IF NOT EXISTS User (
  id VARCHAR(36) PRIMARY KEY,   -- ← غيّرنا لـ 36 عشان UUID()
  roleId VARCHAR(36) NOT NULL,
  fullName VARCHAR(191) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  passwordHash VARCHAR(191) NOT NULL,
  status VARCHAR(191) DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (roleId) REFERENCES Role(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_roleId (roleId)
);

-- بيانات أولية (اختياري)
-- استخدمي UUID() هنا، أو قيم ثابتة لو بدك
INSERT IGNORE INTO Role (id, name) VALUES 
  (UUID(), 'admin'),
  (UUID(), 'teacher'),
  (UUID(), 'student');

  ALTER TABLE User 
MODIFY updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;