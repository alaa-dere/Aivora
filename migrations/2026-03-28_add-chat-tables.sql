CREATE TABLE IF NOT EXISTS chat_conversation (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    teacherId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_course_student_teacher (courseId, studentId, teacherId),
    INDEX idx_studentId (studentId),
    INDEX idx_teacherId (teacherId),
    INDEX idx_courseId  (courseId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_message (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    conversationId  VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    senderId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    senderRole      ENUM('student', 'teacher') NOT NULL,
    body            TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversationId) REFERENCES chat_conversation(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_conversationId (conversationId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_senderId (senderId)
) ENGINE=InnoDB;
