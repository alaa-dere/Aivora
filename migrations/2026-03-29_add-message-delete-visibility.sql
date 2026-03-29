ALTER TABLE admin_teacher_message
  ADD COLUMN deletedForAdminAt DATETIME NULL,
  ADD COLUMN deletedForTeacherAt DATETIME NULL,
  ADD COLUMN deletedForEveryoneAt DATETIME NULL,
  ADD INDEX idx_admin_teacher_deleted_everyone (deletedForEveryoneAt),
  ADD INDEX idx_admin_teacher_deleted_admin (deletedForAdminAt),
  ADD INDEX idx_admin_teacher_deleted_teacher (deletedForTeacherAt);

ALTER TABLE chat_message
  ADD COLUMN deletedForStudentAt DATETIME NULL,
  ADD COLUMN deletedForTeacherAt DATETIME NULL,
  ADD COLUMN deletedForEveryoneAt DATETIME NULL,
  ADD INDEX idx_chat_deleted_everyone (deletedForEveryoneAt),
  ADD INDEX idx_chat_deleted_student (deletedForStudentAt),
  ADD INDEX idx_chat_deleted_teacher (deletedForTeacherAt);

