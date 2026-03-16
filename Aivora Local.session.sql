USE aivora_db;

ALTER TABLE Course
ADD COLUMN imageUrl VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
ADD COLUMN durationWeeks INT DEFAULT 0;

ALTER TABLE Lesson
ADD COLUMN codeContent TEXT NULL COLLATE utf8mb4_unicode_ci;

ALTER TABLE Lesson
MODIFY COLUMN type ENUM('text', 'code_example', 'live_python', 'video_embed', 'quiz', 'mixed') DEFAULT 'text',
MODIFY COLUMN enableLiveEditor BOOLEAN DEFAULT FALSE;

ALTER TABLE Lesson
ADD COLUMN liveEditorLanguage ENUM('python', 'javascript', 'html_css') DEFAULT 'python';
