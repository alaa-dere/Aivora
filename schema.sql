CREATE DATABASE IF NOT EXISTS aivora_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE aivora_db;

-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ role
CREATE TABLE IF NOT EXISTS role (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    name        VARCHAR(191) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB;

-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ user
CREATE TABLE IF NOT EXISTS user (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    roleId          VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    fullName        VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    email           VARCHAR(191) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
    passwordHash    VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    status          ENUM('active', 'inactive') DEFAULT 'active',
    imageUrl        VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (roleId) REFERENCES role(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_roleId (roleId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS category (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    name            VARCHAR(191) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT NULL COLLATE utf8mb4_unicode_ci,
    status          ENUM('active', 'inactive') DEFAULT 'active',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category_status (status)
) ENGINE=InnoDB;


-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ course
CREATE TABLE IF NOT EXISTS course (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    descriptionAr   TEXT NULL COLLATE utf8mb4_unicode_ci,
    imageUrl        VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    durationWeeks   INT DEFAULT 0,
    teacherId       VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    categoryId      VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    price           DECIMAL(10,2) DEFAULT 0.00,
    teacherSharePct DECIMAL(5,2) DEFAULT 70.00 
        COMMENT 'Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â³ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â© ÃƒËœÃ‚Â­ÃƒËœÃ‚ÂµÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â±ÃƒËœÃ‚Â³ Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã¢â‚¬Â  ÃƒËœÃ‚Â³ÃƒËœÃ‚Â¹ÃƒËœÃ‚Â± ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã†â€™Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â±ÃƒËœÃ‚Â³ (Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â«Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â¹ 60 = 60%)',
    status          ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (teacherId) REFERENCES user(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES category(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_teacherId (teacherId),
    INDEX idx_categoryId (categoryId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_path (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    categoryId          VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    title               VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description         TEXT NULL COLLATE utf8mb4_unicode_ci,
    level               ENUM('beginner', 'intermediate', 'advanced', 'all_levels') DEFAULT 'beginner',
    price               DECIMAL(10,2) DEFAULT 0.00,
    status              ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    estimatedHours      INT DEFAULT 0,
    createdBy           VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (categoryId) REFERENCES category(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_learning_path_category (categoryId),
    INDEX idx_learning_path_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_path_course (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    pathId          VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    orderNumber     INT NOT NULL,
    isRequired      BOOLEAN DEFAULT TRUE,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pathId) REFERENCES learning_path(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_path_course (pathId, courseId),
    UNIQUE KEY unique_path_order (pathId, orderNumber),
    INDEX idx_learning_path_course_path (pathId),
    INDEX idx_learning_path_course_course (courseId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS path_enrollment (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    pathId              VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    enrolledAt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    progressPercentage  DECIMAL(5,2) DEFAULT 0.00,
    completedAt         DATETIME NULL,

    FOREIGN KEY (pathId) REFERENCES learning_path(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_path_enrollment (pathId, studentId),
    INDEX idx_path_enrollment_path (pathId),
    INDEX idx_path_enrollment_student (studentId)
) ENGINE=InnoDB;


-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ module
CREATE TABLE IF NOT EXISTS module (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT COLLATE utf8mb4_unicode_ci,
    orderNumber     INT NOT NULL,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (courseId) REFERENCES course(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_order (courseId, orderNumber),
    INDEX idx_courseId (courseId)
) ENGINE=InnoDB;

-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ lesson
CREATE TABLE IF NOT EXISTS lesson (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    moduleId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    title           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description     TEXT COLLATE utf8mb4_unicode_ci,
    content         TEXT COLLATE utf8mb4_unicode_ci,
    codeContent     TEXT COLLATE utf8mb4_unicode_ci,
    videoUrl        VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    type            ENUM('text', 'code_example', 'live_python', 'video_embed', 'quiz', 'mixed') DEFAULT 'text',
    enableLiveEditor BOOLEAN DEFAULT FALSE,
    liveEditorLanguage ENUM('python', 'javascript', 'html_css') DEFAULT 'python',
    orderNumber     INT NOT NULL,
    durationMinutes INT DEFAULT 0,
    isPublished     BOOLEAN DEFAULT FALSE,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (moduleId) REFERENCES module(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_lesson_order (moduleId, orderNumber),
    INDEX idx_moduleId (moduleId)
) ENGINE=InnoDB;

-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ enrollment
CREATE TABLE IF NOT EXISTS enrollment (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    studentId           VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId            VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    enrolledAt          DATETIME DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    progressPercentage  DECIMAL(5,2) DEFAULT 0.00,
    completedAt         DATETIME NULL,

    FOREIGN KEY (studentId) REFERENCES user(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_enrollment (studentId, courseId),
    INDEX idx_studentId (studentId),
    INDEX idx_courseId  (courseId)
) ENGINE=InnoDB;

-- enrollment_payment
CREATE TABLE IF NOT EXISTS enrollment_payment (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    enrollmentId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId       VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    fullName        VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    email           VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    country         VARCHAR(191) NULL COLLATE utf8mb4_unicode_ci,
    cardLast4       VARCHAR(4) NULL COLLATE utf8mb4_unicode_ci,
    paypalEmail     VARCHAR(191) NULL COLLATE utf8mb4_unicode_ci,
    paypalTxnId     VARCHAR(191) NULL COLLATE utf8mb4_unicode_ci,
    method          ENUM('card', 'paypal') DEFAULT 'card',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (enrollmentId) REFERENCES enrollment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_enrollment_payment (enrollmentId),
    INDEX idx_studentId (studentId),
    INDEX idx_courseId (courseId),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB;

-- finance_transaction
CREATE TABLE IF NOT EXISTS finance_transaction (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    type            ENUM('enrollment', 'refund') DEFAULT 'enrollment',
    status          ENUM('success', 'failed', 'pending') DEFAULT 'success',
    amount          DECIMAL(10,2) NOT NULL,
    currency        CHAR(3) DEFAULT 'USD',
    studentId       VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    teacherId       VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    courseId        VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    teacherShare    DECIMAL(10,2) DEFAULT 0.00,
    platformShare   DECIMAL(10,2) DEFAULT 0.00,
    method          ENUM('wallet', 'card', 'cash', 'paypal') DEFAULT 'card',
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

-- live_session
CREATE TABLE IF NOT EXISTS live_session (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    teacherId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    title       VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    description TEXT NULL COLLATE utf8mb4_unicode_ci,
    startAt     DATETIME NOT NULL,
    endAt       DATETIME NOT NULL,
    meetingLink VARCHAR(512) NULL COLLATE utf8mb4_unicode_ci,
    status      ENUM('scheduled', 'completed') DEFAULT 'scheduled',
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (teacherId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_live_teacher (teacherId),
    INDEX idx_live_course (courseId),
    INDEX idx_live_start (startAt)
) ENGINE=InnoDB;

-- live_session_attendance
CREATE TABLE IF NOT EXISTS live_session_attendance (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    sessionId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    attended    TINYINT(1) DEFAULT 0,
    markedAt    DATETIME NULL,

    FOREIGN KEY (sessionId) REFERENCES live_session(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_session_student (sessionId, studentId),
    INDEX idx_att_session (sessionId),
    INDEX idx_att_student (studentId)
) ENGINE=InnoDB;

-- student_notification
CREATE TABLE IF NOT EXISTS student_notification (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    type        ENUM('live_session', 'missed_session', 'course_failed') DEFAULT 'live_session',
    title       VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    message     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    readAt      DATETIME NULL,

    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_student_notif_student (studentId),
    INDEX idx_student_notif_course (courseId),
    INDEX idx_student_notif_type (type),
    INDEX idx_student_notif_read (readAt)
) ENGINE=InnoDB;

-- student_live_miss
CREATE TABLE IF NOT EXISTS student_live_miss (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    missedCount INT DEFAULT 0,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_student_course (studentId, courseId),
    INDEX idx_miss_student (studentId),
    INDEX idx_miss_course (courseId)
) ENGINE=InnoDB;

-- admin_notification
CREATE TABLE IF NOT EXISTS admin_notification (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    type        ENUM('student_signup', 'course_enroll', 'teacher_message') DEFAULT 'student_signup',
    title       VARCHAR(191) NOT NULL COLLATE utf8mb4_unicode_ci,
    message     TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NULL COLLATE utf8mb4_unicode_ci,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    readAt      DATETIME NULL,

    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_createdAt (createdAt),
    INDEX idx_readAt (readAt),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- admin_teacher_thread
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

-- admin_teacher_message
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

-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ lessonprogress
CREATE TABLE IF NOT EXISTS lessonprogress (
    id                  VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    enrollmentId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    lessonId            VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    completed           BOOLEAN DEFAULT FALSE,
    progressPercentage  DECIMAL(5,2) DEFAULT 0.00,
    startedAt           DATETIME NULL,
    completedAt         DATETIME NULL,

    FOREIGN KEY (enrollmentId) REFERENCES enrollment(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (lessonId) REFERENCES lesson(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_progress (enrollmentId, lessonId),
    INDEX idx_enrollmentId (enrollmentId),
    INDEX idx_lessonId     (lessonId)
) ENGINE=InnoDB;

-- certificate
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
    INDEX idx_courseId  (courseId)
) ENGINE=InnoDB;

-- course_question_bank
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

-- course_quiz_attempt
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

-- course_quiz_attempt_answer
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

-- chat_conversation
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

-- chat_message
CREATE TABLE IF NOT EXISTS chat_message (
    id              VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    conversationId  VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    senderId        VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    senderRole      ENUM('student', 'teacher') NOT NULL,
    body            TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    readAt          DATETIME NULL,

    FOREIGN KEY (conversationId) REFERENCES chat_conversation(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_conversationId (conversationId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_senderId (senderId),
    INDEX idx_readAt (readAt)
) ENGINE=InnoDB;

-- ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â¯Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾ passwordresettoken
CREATE TABLE IF NOT EXISTS passwordresettoken (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    userId      VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    token       VARCHAR(255) NOT NULL UNIQUE COLLATE utf8mb4_unicode_ci,
    expiresAt   DATETIME NOT NULL,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES user(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_token (token)
) ENGINE=InnoDB;

-- recent_course_view
CREATE TABLE IF NOT EXISTS recent_course_view (
    id          VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    studentId   VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    courseId    VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
    lastViewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (studentId) REFERENCES user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (courseId) REFERENCES course(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uniq_recent_course_view (studentId, courseId),
    INDEX idx_recent_student (studentId),
    INDEX idx_recent_last_viewed (lastViewedAt)
) ENGINE=InnoDB;

-- ÃƒËœÃ‚Â¨Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â§ÃƒËœÃ‚Âª ÃƒËœÃ‚Â£Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â© (ÃƒËœÃ‚Â§ÃƒËœÃ‚Â®ÃƒËœÃ‚ÂªÃƒâ„¢Ã…Â ÃƒËœÃ‚Â§ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â )
INSERT IGNORE INTO role (id, name) VALUES 
    (UUID(), 'admin'),
    (UUID(), 'teacher'),
    (UUID(), 'student');
