CREATE TABLE IF NOT EXISTS course_question_bank (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    courseId            VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    teacherId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    questionType        ENUM('multiple_choice', 'written') NOT NULL DEFAULT 'multiple_choice',
    questionText        TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    optionsJson         JSON NOT NULL,
    correctOptionIndex  TINYINT UNSIGNED NOT NULL,
    createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_courseId (courseId),
    INDEX idx_teacherId (teacherId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS course_quiz_attempt (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId       VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    totalQuestions  INT NOT NULL,
    correctAnswers  INT NOT NULL,
    scorePercentage DECIMAL(5,2) NOT NULL,
    submittedAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_courseId (courseId),
    INDEX idx_studentId (studentId),
    INDEX idx_submittedAt (submittedAt)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS course_quiz_attempt_answer (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    attemptId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    questionBankId      VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    questionType        ENUM('multiple_choice', 'written') NOT NULL DEFAULT 'multiple_choice',
    questionText        TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    optionsJson         JSON NOT NULL,
    selectedOptionIndex TINYINT NULL,
    selectedTextAnswer  TEXT NULL COLLATE utf8mb4_unicode_ci,
    correctOptionIndex  TINYINT UNSIGNED NOT NULL,
    isCorrect           BOOLEAN NOT NULL,
    createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (attemptId) REFERENCES course_quiz_attempt(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (questionBankId) REFERENCES course_question_bank(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_attemptId (attemptId),
    INDEX idx_questionBankId (questionBankId)
) ENGINE=InnoDB;

ALTER TABLE course_question_bank
ADD COLUMN IF NOT EXISTS questionType ENUM('multiple_choice', 'written')
NOT NULL DEFAULT 'multiple_choice' AFTER teacherId;

ALTER TABLE course_quiz_attempt_answer
ADD COLUMN IF NOT EXISTS questionType ENUM('multiple_choice', 'written')
NOT NULL DEFAULT 'multiple_choice' AFTER questionBankId;

ALTER TABLE course_quiz_attempt_answer
ADD COLUMN IF NOT EXISTS selectedTextAnswer TEXT NULL COLLATE utf8mb4_unicode_ci
AFTER selectedOptionIndex;
