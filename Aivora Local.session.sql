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

-- Fix finance_transaction split based on course price and teacher share
UPDATE finance_transaction ft
JOIN course c ON c.id = ft.courseId
SET
  ft.amount = c.price,
  ft.teacherShare = ROUND(c.price * (COALESCE(c.teacherSharePct, 70) / 100), 2),
  ft.platformShare = ROUND(c.price - ROUND(c.price * (COALESCE(c.teacherSharePct, 70) / 100), 2), 2)
WHERE ft.type = 'enrollment';

-- Delete all payout rows
DELETE FROM finance_payout;

-- Add Arabic description for courses (run once)
ALTER TABLE course
ADD COLUMN descriptionAr TEXT NULL COLLATE utf8mb4_unicode_ci;

-- Sample Arabic descriptions
UPDATE course
SET descriptionAr = 'هذه الدورة تقدم أساسيات بايثون خطوة بخطوة، مع أمثلة عملية وتمارين تساعدك على فهم المتغيرات والدوال والتحكم بالتدفق، وصولاً للتعامل مع الملفات والمكتبات.'
WHERE title = 'Python Programming';

UPDATE course
SET descriptionAr = 'دورة تطوير الويب تغطي أساسيات بناء المواقع باستخدام HTML وCSS وJavaScript، مع تطبيقات عملية لبناء صفحات تفاعلية.'
WHERE title = 'web development';
