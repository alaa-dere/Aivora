CREATE TABLE IF NOT EXISTS certificate (
  id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
  studentId       VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
  courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
  certificateNo   VARCHAR(64) NOT NULL COLLATE utf8mb4_unicode_ci,
  issuedAt        DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (studentId) REFERENCES user(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (courseId) REFERENCES course(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_student_course (studentId, courseId),
  UNIQUE KEY unique_certificate_no (certificateNo),
  INDEX idx_studentId (studentId),
  INDEX idx_courseId (courseId)
) ENGINE=InnoDB;
