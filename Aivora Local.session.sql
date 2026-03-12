USE aivora_db;

ALTER TABLE Course
ADD COLUMN imageUrl VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
ADD COLUMN durationWeeks INT DEFAULT 0;