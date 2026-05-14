CREATE TABLE IF NOT EXISTS notification (
  id VARCHAR(36) PRIMARY KEY,
  recipientId VARCHAR(36) NOT NULL,
  recipientRole ENUM('admin', 'teacher', 'student') NOT NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  relatedUserId VARCHAR(36) NULL,
  courseId VARCHAR(36) NULL,
  sourceTable VARCHAR(64) NULL,
  sourceId VARCHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  readAt DATETIME NULL,
  deletedAt DATETIME NULL,
  INDEX idx_notification_recipient (recipientId, recipientRole),
  INDEX idx_notification_created (createdAt),
  INDEX idx_notification_type (type),
  INDEX idx_notification_read (readAt),
  INDEX idx_notification_source (sourceTable, sourceId)
);

INSERT INTO notification
  (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt)
SELECT
  n.id,
  'admin',
  'admin',
  n.type,
  n.title,
  n.message,
  n.studentId,
  n.courseId,
  'admin_notification',
  n.id,
  n.createdAt,
  n.readAt
FROM admin_notification n
WHERE NOT EXISTS (
  SELECT 1
  FROM notification x
  WHERE x.sourceTable = 'admin_notification' AND x.sourceId = n.id
);

INSERT INTO notification
  (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt)
SELECT
  n.id,
  n.studentId,
  'student',
  n.type,
  n.title,
  n.message,
  NULL,
  n.courseId,
  'student_notification',
  n.id,
  n.createdAt,
  n.readAt
FROM student_notification n
WHERE NOT EXISTS (
  SELECT 1
  FROM notification x
  WHERE x.sourceTable = 'student_notification' AND x.sourceId = n.id
);

INSERT INTO notification
  (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt)
SELECT
  n.id,
  n.teacherId,
  'teacher',
  n.type,
  n.title,
  n.message,
  n.studentId,
  n.courseId,
  'teacher_notification',
  n.id,
  n.createdAt,
  n.readAt
FROM teacher_notification n
WHERE NOT EXISTS (
  SELECT 1
  FROM notification x
  WHERE x.sourceTable = 'teacher_notification' AND x.sourceId = n.id
);
