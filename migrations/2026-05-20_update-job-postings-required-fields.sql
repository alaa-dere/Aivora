ALTER TABLE job_posting
  ADD COLUMN IF NOT EXISTS responsibilities TEXT NULL COLLATE utf8mb4_unicode_ci AFTER requirements,
  ADD COLUMN IF NOT EXISTS otherNotes TEXT NULL COLLATE utf8mb4_unicode_ci AFTER responsibilities;

UPDATE job_posting
SET
  requirements = COALESCE(requirements, ''),
  responsibilities = COALESCE(responsibilities, '');

ALTER TABLE job_posting
  MODIFY COLUMN requirements TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  MODIFY COLUMN responsibilities TEXT NOT NULL COLLATE utf8mb4_unicode_ci;
