CREATE TABLE IF NOT EXISTS job_posting (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    requirements    TEXT NULL COLLATE utf8mb4_unicode_ci,
    status          ENUM('open', 'closed') DEFAULT 'open',
    createdBy       VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_posting_status (status),
    INDEX idx_job_posting_created (createdAt),
    FOREIGN KEY (createdBy) REFERENCES user(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

ALTER TABLE instructor_application
  ADD COLUMN IF NOT EXISTS jobPostingId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci AFTER email;

CREATE INDEX idx_instructor_app_job ON instructor_application (jobPostingId);

ALTER TABLE instructor_application
  ADD CONSTRAINT fk_instructor_app_job
  FOREIGN KEY (jobPostingId) REFERENCES job_posting(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
