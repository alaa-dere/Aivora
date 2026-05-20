CREATE TABLE IF NOT EXISTS enrollment_payment (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    enrollmentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    fullName    VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    email       VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    country     VARCHAR(191) NULL COLLATE utf8mb4_unicode_ci,
    cardLast4   VARCHAR(4) NULL COLLATE utf8mb4_unicode_ci,
    paypalEmail VARCHAR(191) NULL COLLATE utf8mb4_unicode_ci,
    paypalTxnId VARCHAR(191) NULL COLLATE utf8mb4_unicode_ci,
    method      ENUM('card', 'paypal', 'wallet', 'cash') DEFAULT 'card',
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (enrollmentId) REFERENCES enrollment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_enrollment_payment (enrollmentId),
    INDEX idx_studentId (studentId),
    INDEX idx_courseId (courseId),
    INDEX idx_method (method)
) ENGINE=InnoDB;
