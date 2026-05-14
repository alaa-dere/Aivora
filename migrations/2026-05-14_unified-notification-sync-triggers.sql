DROP TRIGGER IF EXISTS trg_admin_notification_ai;
DROP TRIGGER IF EXISTS trg_admin_notification_au;
DROP TRIGGER IF EXISTS trg_admin_notification_ad;
DROP TRIGGER IF EXISTS trg_student_notification_ai;
DROP TRIGGER IF EXISTS trg_student_notification_au;
DROP TRIGGER IF EXISTS trg_student_notification_ad;
DROP TRIGGER IF EXISTS trg_teacher_notification_ai;
DROP TRIGGER IF EXISTS trg_teacher_notification_au;
DROP TRIGGER IF EXISTS trg_teacher_notification_ad;

CREATE TRIGGER trg_admin_notification_ai
AFTER INSERT ON admin_notification
FOR EACH ROW
INSERT INTO notification
  (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt)
VALUES
  (NEW.id, 'admin', 'admin', NEW.type, NEW.title, NEW.message, NEW.studentId, NEW.courseId, 'admin_notification', NEW.id, NEW.createdAt, NEW.readAt)
ON DUPLICATE KEY UPDATE
  recipientId = VALUES(recipientId),
  recipientRole = VALUES(recipientRole),
  type = VALUES(type),
  title = VALUES(title),
  message = VALUES(message),
  relatedUserId = VALUES(relatedUserId),
  courseId = VALUES(courseId),
  createdAt = VALUES(createdAt),
  readAt = VALUES(readAt),
  deletedAt = NULL;

CREATE TRIGGER trg_admin_notification_au
AFTER UPDATE ON admin_notification
FOR EACH ROW
UPDATE notification
SET
  recipientId = 'admin',
  recipientRole = 'admin',
  type = NEW.type,
  title = NEW.title,
  message = NEW.message,
  relatedUserId = NEW.studentId,
  courseId = NEW.courseId,
  createdAt = NEW.createdAt,
  readAt = NEW.readAt,
  deletedAt = NULL
WHERE sourceTable = 'admin_notification' AND sourceId = NEW.id;

CREATE TRIGGER trg_admin_notification_ad
AFTER DELETE ON admin_notification
FOR EACH ROW
DELETE FROM notification
WHERE sourceTable = 'admin_notification' AND sourceId = OLD.id;

CREATE TRIGGER trg_student_notification_ai
AFTER INSERT ON student_notification
FOR EACH ROW
INSERT INTO notification
  (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt)
VALUES
  (NEW.id, NEW.studentId, 'student', NEW.type, NEW.title, NEW.message, NULL, NEW.courseId, 'student_notification', NEW.id, NEW.createdAt, NEW.readAt)
ON DUPLICATE KEY UPDATE
  recipientId = VALUES(recipientId),
  recipientRole = VALUES(recipientRole),
  type = VALUES(type),
  title = VALUES(title),
  message = VALUES(message),
  relatedUserId = VALUES(relatedUserId),
  courseId = VALUES(courseId),
  createdAt = VALUES(createdAt),
  readAt = VALUES(readAt),
  deletedAt = NULL;

CREATE TRIGGER trg_student_notification_au
AFTER UPDATE ON student_notification
FOR EACH ROW
UPDATE notification
SET
  recipientId = NEW.studentId,
  recipientRole = 'student',
  type = NEW.type,
  title = NEW.title,
  message = NEW.message,
  relatedUserId = NULL,
  courseId = NEW.courseId,
  createdAt = NEW.createdAt,
  readAt = NEW.readAt,
  deletedAt = NULL
WHERE sourceTable = 'student_notification' AND sourceId = NEW.id;

CREATE TRIGGER trg_student_notification_ad
AFTER DELETE ON student_notification
FOR EACH ROW
DELETE FROM notification
WHERE sourceTable = 'student_notification' AND sourceId = OLD.id;

CREATE TRIGGER trg_teacher_notification_ai
AFTER INSERT ON teacher_notification
FOR EACH ROW
INSERT INTO notification
  (id, recipientId, recipientRole, type, title, message, relatedUserId, courseId, sourceTable, sourceId, createdAt, readAt)
VALUES
  (NEW.id, NEW.teacherId, 'teacher', NEW.type, NEW.title, NEW.message, NEW.studentId, NEW.courseId, 'teacher_notification', NEW.id, NEW.createdAt, NEW.readAt)
ON DUPLICATE KEY UPDATE
  recipientId = VALUES(recipientId),
  recipientRole = VALUES(recipientRole),
  type = VALUES(type),
  title = VALUES(title),
  message = VALUES(message),
  relatedUserId = VALUES(relatedUserId),
  courseId = VALUES(courseId),
  createdAt = VALUES(createdAt),
  readAt = VALUES(readAt),
  deletedAt = NULL;

CREATE TRIGGER trg_teacher_notification_au
AFTER UPDATE ON teacher_notification
FOR EACH ROW
UPDATE notification
SET
  recipientId = NEW.teacherId,
  recipientRole = 'teacher',
  type = NEW.type,
  title = NEW.title,
  message = NEW.message,
  relatedUserId = NEW.studentId,
  courseId = NEW.courseId,
  createdAt = NEW.createdAt,
  readAt = NEW.readAt,
  deletedAt = NULL
WHERE sourceTable = 'teacher_notification' AND sourceId = NEW.id;

CREATE TRIGGER trg_teacher_notification_ad
AFTER DELETE ON teacher_notification
FOR EACH ROW
DELETE FROM notification
WHERE sourceTable = 'teacher_notification' AND sourceId = OLD.id;
