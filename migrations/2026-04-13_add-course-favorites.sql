CREATE TABLE IF NOT EXISTS favorite_course (
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (studentId, courseId),
    INDEX idx_favorite_course_student (studentId),
    INDEX idx_favorite_course_course (courseId),
    CONSTRAINT fk_favorite_course_student FOREIGN KEY (studentId)
      REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_favorite_course_course FOREIGN KEY (courseId)
      REFERENCES course(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
