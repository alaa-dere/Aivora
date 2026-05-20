CREATE TABLE IF NOT EXISTS instructor_application (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    fullName        VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    email           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    phone           VARCHAR(40) NULL COLLATE utf8mb4_unicode_ci,
    bio             TEXT NULL COLLATE utf8mb4_unicode_ci,
    cvFileUrl       VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
    status          ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
    reviewedBy      VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    reviewedAt      DATETIME NULL,
    adminNotes      TEXT NULL COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reviewedBy) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_instructor_app_status (status),
    INDEX idx_instructor_app_created (createdAt),
    INDEX idx_instructor_app_email (email)
) ENGINE=InnoDB;
