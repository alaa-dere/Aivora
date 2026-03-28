CREATE TABLE IF NOT EXISTS admin_teacher_thread (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    adminId         VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    teacherId       VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastMessageAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (adminId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_thread (adminId, teacherId),
    INDEX idx_adminId (adminId),
    INDEX idx_teacherId (teacherId),
    INDEX idx_lastMessageAt (lastMessageAt)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_teacher_message (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    threadId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    senderId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    senderRole  ENUM('admin', 'teacher') NOT NULL,
    body        TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    readAt      DATETIME NULL,

    FOREIGN KEY (threadId) REFERENCES admin_teacher_thread(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (senderId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_threadId (threadId),
    INDEX idx_senderId (senderId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_readAt (readAt)
) ENGINE=InnoDB;
