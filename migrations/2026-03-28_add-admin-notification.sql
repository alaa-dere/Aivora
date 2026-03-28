CREATE TABLE IF NOT EXISTS admin_notification (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    type        ENUM('student_signup', 'course_enroll') DEFAULT 'student_signup',
    title       VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    message     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    readAt      DATETIME NULL,

    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_createdAt (createdAt),
    INDEX idx_readAt (readAt),
    INDEX idx_type (type)
) ENGINE=InnoDB;
