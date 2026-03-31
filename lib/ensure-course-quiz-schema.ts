import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

let ensurePromise: Promise<void> | null = null;

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );

  return rows.length > 0;
}

export async function ensureCourseQuizSchema() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_question_bank (
          id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
          courseId            VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
          teacherId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
          questionType        ENUM('multiple_choice', 'written', 'true_false') NOT NULL DEFAULT 'multiple_choice',
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
      ) ENGINE=InnoDB
    `);
    if (!(await hasColumn('course_question_bank', 'questionType'))) {
      await pool.query(`
        ALTER TABLE course_question_bank
        ADD COLUMN questionType ENUM('multiple_choice', 'written', 'true_false')
        NOT NULL DEFAULT 'multiple_choice' AFTER teacherId
      `);
    }
    await pool.query(`
      ALTER TABLE course_question_bank
      MODIFY COLUMN questionType ENUM('multiple_choice', 'written', 'true_false')
      NOT NULL DEFAULT 'multiple_choice'
    `);

    await pool.query(`
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
      ) ENGINE=InnoDB
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_quiz_attempt_answer (
          id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
          attemptId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
          questionBankId      VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
          questionType        ENUM('multiple_choice', 'written', 'true_false') NOT NULL DEFAULT 'multiple_choice',
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
      ) ENGINE=InnoDB
    `);
    if (!(await hasColumn('course_quiz_attempt_answer', 'questionType'))) {
      await pool.query(`
        ALTER TABLE course_quiz_attempt_answer
        ADD COLUMN questionType ENUM('multiple_choice', 'written', 'true_false')
        NOT NULL DEFAULT 'multiple_choice' AFTER questionBankId
      `);
    }
    await pool.query(`
      ALTER TABLE course_quiz_attempt_answer
      MODIFY COLUMN questionType ENUM('multiple_choice', 'written', 'true_false')
      NOT NULL DEFAULT 'multiple_choice'
    `);
    if (!(await hasColumn('course_quiz_attempt_answer', 'selectedTextAnswer'))) {
      await pool.query(`
        ALTER TABLE course_quiz_attempt_answer
        ADD COLUMN selectedTextAnswer TEXT NULL COLLATE utf8mb4_unicode_ci
        AFTER selectedOptionIndex
      `);
    }
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}
