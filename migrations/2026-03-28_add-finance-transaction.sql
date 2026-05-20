CREATE TABLE IF NOT EXISTS finance_transaction (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    type            ENUM('enrollment', 'refund', 'payout') DEFAULT 'enrollment',
    status          ENUM('success', 'failed', 'pending') DEFAULT 'success',
    amount          DECIMAL(10,2) NOT NULL,
    currency        CHAR(3) DEFAULT 'USD',
    studentId       VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    teacherId       VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    teacherShare    DECIMAL(10,2) DEFAULT 0.00,
    platformShare   DECIMAL(10,2) DEFAULT 0.00,
    method          ENUM('wallet', 'card', 'cash') DEFAULT 'card',
    notes           VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_transactionDate (transactionDate),
    INDEX idx_studentId (studentId),
    INDEX idx_teacherId (teacherId),
    INDEX idx_courseId (courseId),
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB;
