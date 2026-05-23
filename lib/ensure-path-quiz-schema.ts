import pool from '@/lib/db';

let ensurePromise: Promise<void> | null = null;

export async function ensurePathQuizSchema() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS path_quiz_attempt (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        pathId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        totalQuestions INT NOT NULL,
        correctAnswers INT NOT NULL,
        scorePercentage DECIMAL(5,2) NOT NULL,
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pathId) REFERENCES learning_path(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (studentId) REFERENCES user(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_path_quiz_attempt_path (pathId),
        INDEX idx_path_quiz_attempt_student (studentId),
        INDEX idx_path_quiz_attempt_submitted (submittedAt)
      ) ENGINE=InnoDB
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS path_quiz_attempt_answer (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        attemptId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        questionBankId VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
        questionType ENUM('multiple_choice', 'written', 'true_false') NOT NULL DEFAULT 'multiple_choice',
        questionText TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
        optionsJson JSON NOT NULL,
        selectedOptionIndex TINYINT NULL,
        selectedTextAnswer TEXT NULL COLLATE utf8mb4_unicode_ci,
        correctOptionIndex TINYINT UNSIGNED NOT NULL,
        isCorrect BOOLEAN NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attemptId) REFERENCES path_quiz_attempt(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (questionBankId) REFERENCES course_question_bank(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_path_quiz_answer_attempt (attemptId),
        INDEX idx_path_quiz_answer_bank (questionBankId)
      ) ENGINE=InnoDB
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS path_certificate (
        id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
        pathId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        studentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
        certificateNo VARCHAR(64) NOT NULL COLLATE utf8mb4_unicode_ci,
        issuedAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_path_certificate_student (pathId, studentId),
        FOREIGN KEY (pathId) REFERENCES learning_path(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (studentId) REFERENCES user(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_path_certificate_issued (issuedAt)
      ) ENGINE=InnoDB
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

