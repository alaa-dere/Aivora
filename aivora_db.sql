SET FOREIGN_KEY_CHECKS=0;

-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: aivora_db
-- 
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
--
-- Server version	8.0.44
--
-- Table structure for table `_prisma_migrations`
--
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations` (  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,  `finished_at` datetime(3) DEFAULT NULL,  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,  `logs` text COLLATE utf8mb4_unicode_ci,  `rolled_back_at` datetime(3) DEFAULT NULL,  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',  PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `_prisma_migrations`
--
LOCK TABLES `_prisma_migrations` WRITE;
INSERT INTO `_prisma_migrations` VALUES ('7ce3e0dd-370b-4d74-bb02-1e053a4aa092','76d65994592870fb335b9c5e8da89b20c586bdd771ad64cf37e23683e721d177','2026-03-02 17:49:15.814','20260302174915_init_roles_users',NULL,NULL,'2026-03-02 17:49:15.714',1);
UNLOCK TABLES;
--
-- Table structure for table `admin_notification`
--
DROP TABLE IF EXISTS `admin_notification`;
CREATE TABLE `admin_notification` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `type` enum('student_signup','course_enroll') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'student_signup',  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `readAt` datetime DEFAULT NULL,  PRIMARY KEY (`id`),  KEY `studentId` (`studentId`),  KEY `courseId` (`courseId`),  KEY `idx_createdAt` (`createdAt`),  KEY `idx_readAt` (`readAt`),  KEY `idx_type` (`type`),  CONSTRAINT `admin_notification_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,  CONSTRAINT `admin_notification_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `admin_notification`
--
LOCK TABLES `admin_notification` WRITE;
INSERT INTO `admin_notification` VALUES ('1ce99c17-2ad1-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 21:08:24','2026-03-30 10:02:54'),('f75262de-2acf-11f1-97b2-6c02e0d26821','student_signup','New Student Account','meme created a student account.','f74bdb60-2acf-11f1-97b2-6c02e0d26821',NULL,'2026-03-28 21:00:12','2026-03-30 10:02:58'),('fcac2ea2-2ad0-11f1-97b2-6c02e0d26821','student_signup','New Student Account','ola abdo created a student account.','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',NULL,'2026-03-28 21:07:30','2026-03-30 10:02:56');
UNLOCK TABLES;
--
-- Table structure for table `admin_teacher_message`
--
DROP TABLE IF EXISTS `admin_teacher_message`;
CREATE TABLE `admin_teacher_message` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `threadId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `senderId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `senderRole` enum('admin','teacher') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `readAt` datetime DEFAULT NULL,  `deletedForAdminAt` datetime DEFAULT NULL,  `deletedForTeacherAt` datetime DEFAULT NULL,  `deletedForEveryoneAt` datetime DEFAULT NULL,  PRIMARY KEY (`id`),  KEY `idx_threadId` (`threadId`),  KEY `idx_senderId` (`senderId`),  KEY `idx_createdAt` (`createdAt`),  KEY `idx_readAt` (`readAt`),  KEY `idx_admin_teacher_deleted_everyone` (`deletedForEveryoneAt`),  KEY `idx_admin_teacher_deleted_admin` (`deletedForAdminAt`),  KEY `idx_admin_teacher_deleted_teacher` (`deletedForTeacherAt`),  CONSTRAINT `admin_teacher_message_ibfk_1` FOREIGN KEY (`threadId`) REFERENCES `admin_teacher_thread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `admin_teacher_message_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `admin_teacher_message`
--
LOCK TABLES `admin_teacher_message` WRITE;
INSERT INTO `admin_teacher_message` VALUES ('19774ee7-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','hiiiiiiiiiiiiiiiiiiiiiiii','2026-03-29 21:07:07','2026-03-29 21:08:07',NULL,NULL,NULL),('1d825330-2b93-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','?','2026-03-29 20:17:08','2026-03-29 20:18:02',NULL,NULL,NULL),('2ec89cbd-2acb-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hello','2026-03-28 20:25:57','2026-03-28 20:45:18',NULL,NULL,NULL),('4d36ccb6-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','dont worry','2026-03-29 20:32:47','2026-03-29 20:33:46',NULL,NULL,NULL),('4f095bf7-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','azewg','2026-03-29 20:32:50','2026-03-29 20:33:46','2026-03-29 20:32:52',NULL,NULL),('5f3df49c-2b91-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','i want to ask about salary','2026-03-29 20:04:39','2026-03-29 20:07:09',NULL,NULL,NULL),('79f8aaef-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','what??','2026-03-29 20:34:02','2026-03-29 20:39:21',NULL,NULL,NULL),('7f9bf662-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','fyjufvg','2026-03-29 20:34:11','2026-03-29 20:39:21',NULL,NULL,'2026-03-29 20:34:15'),('9c37a740-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','hi teacher','2026-03-29 21:10:47','2026-03-29 21:11:25',NULL,NULL,NULL),('a054f545-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','rgaeslknhjg','2026-03-29 21:10:54','2026-03-29 21:11:25',NULL,NULL,'2026-03-29 21:11:00'),('a108878a-2b98-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hi','2026-03-29 20:56:36','2026-03-29 21:06:57',NULL,NULL,NULL),('a2b7adf7-2b91-11f1-97b2-6c02e0d26821','a2b54e72-2b91-11f1-97b2-6c02e0d26821','a3891b1e-1bab-11f1-97b2-6c02e0d26821','teacher','hi admin','2026-03-29 20:06:32','2026-03-29 20:07:07',NULL,NULL,NULL),('a8bdfdd8-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','sorry','2026-03-29 21:11:08','2026-03-29 21:11:25','2026-03-29 21:11:10',NULL,NULL),('f456d7f8-2aca-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','hi','2026-03-28 20:24:19','2026-03-28 20:25:47',NULL,NULL,NULL);
UNLOCK TABLES;
--
-- Table structure for table `admin_teacher_thread`
--
DROP TABLE IF EXISTS `admin_teacher_thread`;
CREATE TABLE `admin_teacher_thread` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `adminId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `lastMessageAt` datetime DEFAULT CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_thread` (`adminId`,`teacherId`),  KEY `idx_adminId` (`adminId`),  KEY `idx_teacherId` (`teacherId`),  KEY `idx_lastMessageAt` (`lastMessageAt`),  CONSTRAINT `admin_teacher_thread_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `admin_teacher_thread_ibfk_2` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `admin_teacher_thread`
--
LOCK TABLES `admin_teacher_thread` WRITE;
INSERT INTO `admin_teacher_thread` VALUES ('a2b54e72-2b91-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','a3891b1e-1bab-11f1-97b2-6c02e0d26821','2026-03-29 20:06:32','2026-03-29 20:07:38'),('f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 20:24:19','2026-03-29 21:11:08');
UNLOCK TABLES;
--
-- Table structure for table `certificate`
--
DROP TABLE IF EXISTS `certificate`;
CREATE TABLE `certificate` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `certificateNo` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `issuedAt` datetime DEFAULT CURRENT_TIMESTAMP,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_student_course` (`studentId`,`courseId`),  UNIQUE KEY `unique_certificate_no` (`certificateNo`),  KEY `idx_studentId` (`studentId`),  KEY `idx_courseId` (`courseId`),  CONSTRAINT `certificate_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `certificate_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `certificate`
--
LOCK TABLES `certificate` WRITE;
INSERT INTO `certificate` VALUES ('a46756a6-29fb-11f1-97b2-6c02e0d26821','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260327-A46756','2026-03-27 18:40:19','2026-03-27 18:40:19','2026-03-27 18:40:19');
UNLOCK TABLES;
--
-- Table structure for table `chat_conversation`
--
DROP TABLE IF EXISTS `chat_conversation`;
CREATE TABLE `chat_conversation` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_course_student_teacher` (`courseId`,`studentId`,`teacherId`),  KEY `idx_studentId` (`studentId`),  KEY `idx_teacherId` (`teacherId`),  KEY `idx_courseId` (`courseId`),  CONSTRAINT `chat_conversation_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `chat_conversation_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `chat_conversation_ibfk_3` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `chat_conversation`
--
LOCK TABLES `chat_conversation` WRITE;
INSERT INTO `chat_conversation` VALUES ('26e74541-2ac1-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 19:14:09','2026-03-28 19:14:09'),('5752e01e-2abf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','955acab2-18fd-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 19:01:11','2026-03-28 19:01:11'),('78b36abc-2acc-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 20:35:11','2026-03-28 20:35:11'),('98e40a6b-2c03-11f1-9455-00090ffe0001','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','32546860-1bab-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-30 09:42:18','2026-03-30 09:42:18'),('b33082ec-2b99-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','b6c714e4-1bab-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-29 21:04:16','2026-03-29 21:04:16'),('ba8cb338-2b9a-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f74bdb60-2acf-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-29 21:11:37','2026-03-29 21:11:37');
UNLOCK TABLES;
--
-- Table structure for table `chat_message`
--
DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `conversationId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `senderId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `senderRole` enum('student','teacher') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `readAt` datetime DEFAULT NULL,  `deletedForStudentAt` datetime DEFAULT NULL,  `deletedForTeacherAt` datetime DEFAULT NULL,  `deletedForEveryoneAt` datetime DEFAULT NULL,  PRIMARY KEY (`id`),  KEY `idx_conversationId` (`conversationId`),  KEY `idx_createdAt` (`createdAt`),  KEY `idx_senderId` (`senderId`),  KEY `idx_readAt` (`readAt`),  KEY `idx_chat_deleted_everyone` (`deletedForEveryoneAt`),  KEY `idx_chat_deleted_student` (`deletedForStudentAt`),  KEY `idx_chat_deleted_teacher` (`deletedForTeacherAt`),  CONSTRAINT `chat_message_ibfk_1` FOREIGN KEY (`conversationId`) REFERENCES `chat_conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `chat_message`
--
LOCK TABLES `chat_message` WRITE;
INSERT INTO `chat_message` VALUES ('190882d6-2acc-11f1-97b2-6c02e0d26821','26e74541-2ac1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','student','hi','2026-03-28 20:32:30','2026-03-29 19:56:05',NULL,NULL,NULL),('1eeebfec-2acc-11f1-97b2-6c02e0d26821','26e74541-2ac1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','student','helloooooooooowwwwwwwwwwwww','2026-03-28 20:32:40','2026-03-29 19:56:05',NULL,NULL,NULL),('2fefa71e-2ac1-11f1-97b2-6c02e0d26821','26e74541-2ac1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','student','hello teacher','2026-03-28 19:14:24','2026-03-29 19:56:05',NULL,NULL,NULL),('5f39d0d3-2abf-11f1-97b2-6c02e0d26821','5752e01e-2abf-11f1-97b2-6c02e0d26821','955acab2-18fd-11f1-97b2-6c02e0d26821','student','hi teacher','2026-03-28 19:01:24','2026-03-29 20:22:26',NULL,NULL,NULL),('820aa38f-2acc-11f1-97b2-6c02e0d26821','78b36abc-2acc-11f1-97b2-6c02e0d26821','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','student','i want to ask a question','2026-03-28 20:35:26','2026-03-29 20:33:30',NULL,NULL,NULL),('b5dcb073-2b99-11f1-97b2-6c02e0d26821','b33082ec-2b99-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hi','2026-03-29 21:04:20',NULL,NULL,NULL,NULL),('be1935c1-2b9a-11f1-97b2-6c02e0d26821','ba8cb338-2b9a-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hi meme','2026-03-29 21:11:43',NULL,NULL,NULL,NULL);
UNLOCK TABLES;
--
-- Table structure for table `course`
--
DROP TABLE IF EXISTS `course`;
CREATE TABLE `course` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `price` decimal(10,2) DEFAULT '0.00',  `teacherSharePct` int DEFAULT '60',  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `durationWeeks` int DEFAULT '0',  PRIMARY KEY (`id`),  KEY `idx_teacherId` (`teacherId`),  CONSTRAINT `course_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `course`
--
LOCK TABLES `course` WRITE;
INSERT INTO `course` VALUES ('4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Python Programming','This course introduces learners to the fundamentals of Python programming, one of the most widely used programming languages in software development, data science, artificial intelligence, and automation. Students will learn programming concepts such as variables, control structures, functions, and object-oriented programming while developing practical programs and solving real-world problems. The course gradually progresses from basic syntax to advanced concepts like file handling, modules, and working with external libraries.\r\n\r\nPython is known for its simple syntax, readability, and large ecosystem of libraries, making it an ideal language for beginners and professionals alike. By the end of this course, students will be able to write efficient Python programs and apply programming skills in various applications.','f1779632-1905-11f1-97b2-6c02e0d26821',20.00,60,'published','2026-03-15 15:53:12','2026-03-16 00:54:54','/uploads/courses/course-4f0dd6ed-2076-11f1-97b2-6c02e0d26821-1773615294920.webp',3),('8398c88d-2840-11f1-97b2-6c02e0d26821','web development','important course','a3891b1e-1bab-11f1-97b2-6c02e0d26821',40.00,70,'archived','2026-03-25 13:48:17','2026-03-25 13:48:17',NULL,6);
UNLOCK TABLES;
--
-- Table structure for table `enrollment`
--
DROP TABLE IF EXISTS `enrollment`;
CREATE TABLE `enrollment` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `enrolledAt` datetime DEFAULT CURRENT_TIMESTAMP,  `status` enum('enrolled','in_progress','completed','dropped') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'enrolled',  `progressPercentage` decimal(5,2) DEFAULT '0.00',  `completedAt` datetime DEFAULT NULL,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_enrollment` (`studentId`,`courseId`),  KEY `courseId` (`courseId`),  CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `enrollment`
--
LOCK TABLES `enrollment` WRITE;
INSERT INTO `enrollment` VALUES ('1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 21:08:24','enrolled',0.00,NULL),('3fe31a6b-20d3-11f1-97b2-6c02e0d26821','32546860-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-16 02:58:30','enrolled',33.00,NULL),('40298899-2ab4-11f1-97b2-6c02e0d26821','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 17:41:48','completed',100.00,'2026-03-28 17:42:24'),('5a40313e-2a8e-11f1-97b2-6c02e0d26821','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 13:10:31','completed',100.00,'2026-03-28 13:28:50'),('69dc343f-20d1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-16 02:45:22','completed',100.00,NULL),('6d69724c-2842-11f1-97b2-6c02e0d26821','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-25 14:01:59','completed',100.00,'2026-03-27 18:40:19'),('8401c02b-2a91-11f1-97b2-6c02e0d26821','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 13:33:09','completed',100.00,'2026-03-28 13:33:33'),('9df9d40e-2ad0-11f1-97b2-6c02e0d26821','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 21:04:51','enrolled',0.00,NULL),('e2010964-2ab4-11f1-97b2-6c02e0d26821','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 17:46:19','completed',100.00,'2026-03-28 17:46:46'),('e3ba91db-2841-11f1-97b2-6c02e0d26821','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-25 13:58:08','enrolled',0.00,NULL);
UNLOCK TABLES;
--
-- Table structure for table `enrollment_payment`
--
DROP TABLE IF EXISTS `enrollment_payment`;
CREATE TABLE `enrollment_payment` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `enrollmentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `fullName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `country` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `cardLast4` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `paypalEmail` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `paypalTxnId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `method` enum('card','paypal','wallet','cash') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'card',  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_enrollment_payment` (`enrollmentId`),  KEY `idx_studentId` (`studentId`),  KEY `idx_courseId` (`courseId`),  KEY `idx_method` (`method`),  CONSTRAINT `enrollment_payment_ibfk_1` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `enrollment_payment_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `enrollment_payment_ibfk_3` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `enrollment_payment`
--
LOCK TABLES `enrollment_payment` WRITE;
INSERT INTO `enrollment_payment` VALUES ('1cdd5bad-2ad1-11f1-97b2-6c02e0d26821','1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','ola','ola@gmail.com','Bahamas','5678',NULL,NULL,'card','2026-03-28 21:08:24');
UNLOCK TABLES;
--
-- Table structure for table `finance_payout`
--
DROP TABLE IF EXISTS `finance_payout`;
CREATE TABLE `finance_payout` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `payoutDate` datetime DEFAULT CURRENT_TIMESTAMP,  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `amount` decimal(10,2) NOT NULL,  `status` enum('success','failed','pending') COLLATE utf8mb4_general_ci DEFAULT 'pending',  `method` enum('wallet','card','cash') COLLATE utf8mb4_general_ci DEFAULT 'wallet',  `reference` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  KEY `idx_payoutDate` (`payoutDate`),  KEY `idx_teacherId` (`teacherId`),  KEY `idx_status` (`status`),  CONSTRAINT `finance_payout_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
--
-- Dumping data for table `finance_payout`
--
LOCK TABLES `finance_payout` WRITE;
INSERT INTO `finance_payout` VALUES ('e226578a-2852-11f1-9455-00090ffe0001','2026-03-25 15:59:47','3add5b47-1a34-11f1-9a31-00090ffe0001',119.00,'pending','card','Auto payout for enrollment e21f866a-2852-11f1-9455-00090ffe0001','2026-03-25 15:59:47');
UNLOCK TABLES;
--
-- Table structure for table `finance_transaction`
--
DROP TABLE IF EXISTS `finance_transaction`;
CREATE TABLE `finance_transaction` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `transactionDate` datetime DEFAULT CURRENT_TIMESTAMP,  `type` enum('enrollment','refund','payout') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'enrollment',  `status` enum('success','failed','pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'success',  `amount` decimal(10,2) NOT NULL,  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `teacherShare` decimal(10,2) DEFAULT '0.00',  `platformShare` decimal(10,2) DEFAULT '0.00',  `method` enum('wallet','card','cash') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'card',  `notes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  KEY `idx_transactionDate` (`transactionDate`),  KEY `idx_studentId` (`studentId`),  KEY `idx_teacherId` (`teacherId`),  KEY `idx_courseId` (`courseId`),  KEY `idx_status` (`status`),  KEY `idx_type` (`type`),  CONSTRAINT `finance_transaction_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,  CONSTRAINT `finance_transaction_ibfk_2` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,  CONSTRAINT `finance_transaction_ibfk_3` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `finance_transaction`
--
LOCK TABLES `finance_transaction` WRITE;
INSERT INTO `finance_transaction` VALUES ('1cdb0a73-2ad1-11f1-97b2-6c02e0d26821','2026-03-28 21:08:24','enrollment','success',20.00,'USD','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'card','Enrollment payment','2026-03-28 21:08:24'),('9e00ff68-2ad0-11f1-97b2-6c02e0d26821','2026-03-28 21:04:51','enrollment','success',20.00,'USD','f74bdb60-2acf-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'card','Enrollment payment','2026-03-28 21:04:51');
UNLOCK TABLES;
--
-- Table structure for table `lesson`
--
DROP TABLE IF EXISTS `lesson`;
CREATE TABLE `lesson` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `moduleId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `type` enum('text','code_example','live_python','video_embed','quiz','mixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text',  `enableLiveEditor` tinyint(1) NOT NULL DEFAULT '0',  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'lesson content in Markdown + code blocks',  `videoUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `orderNumber` int NOT NULL,  `durationMinutes` int DEFAULT '0',  `isPublished` tinyint(1) DEFAULT '0',  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  `codeContent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,  `liveEditorLanguage` enum('python','javascript','html_css') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'python',  PRIMARY KEY (`id`),  UNIQUE KEY `unique_lesson_order` (`moduleId`,`orderNumber`),  CONSTRAINT `lesson_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `lesson`
--
LOCK TABLES `lesson` WRITE;
INSERT INTO `lesson` VALUES ('812b4936-207f-11f1-97b2-6c02e0d26821','7c0ea9ec-2079-11f1-97b2-6c02e0d26821','Installing Python','mixed',0,NULL,'To start programming with Python, you need to install it on your computer.\n\n### Steps:\n\n1.Download Python from the official website\nhttps://www.python.org/downloads/\n\n2.Install Python.\n\n3.Ensure \"Add Python to PATH\" is checked during installation.\n\n### Verify Installation\nOpen the terminal and type:\n```python 
--version```\nIf Python is installed correctly, it will show the version number.\n\n',NULL,2,10,1,'2026-03-15 16:59:02','2026-03-15 23:03:16',NULL,'python'),('eeb08b04-20b0-11f1-97b2-6c02e0d26821','603620ee-20b0-11f1-97b2-6c02e0d26821','Variables and Data Types','text',1,NULL,'Variables store data values.\n### Example\nname = \"Lane\"\nage = 22\nheight = 1.65\n\n### Common Data Types:\nType     	     Example\nInteger	          10\nFloat	           3.14\nString	          \"Hello\"\nBoolean      	 True / False\n\n### Practice:\nCreate variables for:\nYour name\nYour age\nYour favorite color\n{{starter:\nname = \"\"\n}}',NULL,1,10,1,'2026-03-15 22:52:51','2026-03-15 23:06:08',NULL,'python'),('f49dab1e-207c-11f1-97b2-6c02e0d26821','7c0ea9ec-2079-11f1-97b2-6c02e0d26821','What is Python?','mixed',1,NULL,'Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used in many fields such as:\n\nWeb development\nData science\nArtificial intelligence\nAutomation\nSoftware development\n\nPython was designed to make programming easier to learn and faster to develop.\n\n## Example:\n\nA simple Python program:\n```print(\"Hello, World!\")```\nWrite a Python program that prints : \"Welcome to the Python course!\"\n{{starter:\nprint(\"\")\n}}\n{{video:https://youtu.be/vE7Cy5csYbQ}}\n',NULL,1,5,1,'2026-03-15 16:40:47','2026-03-15 23:02:01',NULL,'python');
UNLOCK TABLES;
--
-- Table structure for table `lessonprogress`
--
DROP TABLE IF EXISTS `lessonprogress`;
CREATE TABLE `lessonprogress` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `enrollmentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `lessonId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `completed` tinyint(1) DEFAULT '0',  `progressPercentage` decimal(5,2) DEFAULT '0.00',  `startedAt` datetime DEFAULT NULL,  `completedAt` datetime DEFAULT NULL,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_progress` (`enrollmentId`,`lessonId`),  KEY `lessonId` (`lessonId`),  CONSTRAINT `lessonprogress_ibfk_1` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,  CONSTRAINT `lessonprogress_ibfk_2` FOREIGN KEY (`lessonId`) REFERENCES `lesson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `lessonprogress`
--
LOCK TABLES `lessonprogress` WRITE;
INSERT INTO `lessonprogress` VALUES ('20432268-29fa-11f1-97b2-6c02e0d26821','6d69724c-2842-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-27 18:29:28','2026-03-27 18:29:28'),('46597ffd-2ab4-11f1-97b2-6c02e0d26821','40298899-2ab4-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:42:25','2026-03-28 17:42:09'),('4ce00391-20d3-11f1-97b2-6c02e0d26821','3fe31a6b-20d3-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:58:52','2026-03-16 02:58:52'),('4da7057d-2ab4-11f1-97b2-6c02e0d26821','40298899-2ab4-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:42:16','2026-03-28 17:42:13'),('55293177-2ab4-11f1-97b2-6c02e0d26821','40298899-2ab4-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:42:23','2026-03-28 17:42:24'),('81cb3ce9-20d1-11f1-97b2-6c02e0d26821','69dc343f-20d1-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:46:02','2026-03-16 02:46:02'),('88824701-2a91-11f1-97b2-6c02e0d26821','8401c02b-2a91-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:33:33','2026-03-28 13:33:21'),('8907cbdb-20d1-11f1-97b2-6c02e0d26821','69dc343f-20d1-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:46:14','2026-03-16 02:46:14'),('8b983012-2a91-11f1-97b2-6c02e0d26821','8401c02b-2a91-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:33:26','2026-03-28 13:33:23'),('904ba642-20d1-11f1-97b2-6c02e0d26821','69dc343f-20d1-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:46:26','2026-03-16 02:46:26'),('90c3d3cd-2a91-11f1-97b2-6c02e0d26821','8401c02b-2a91-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:33:31','2026-03-28 13:33:33'),('922f08a2-2a8e-11f1-97b2-6c02e0d26821','5a40313e-2a8e-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:31:51','2026-03-28 13:12:43'),('9f005299-29fb-11f1-97b2-6c02e0d26821','6d69724c-2842-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-27 18:40:10','2026-03-27 18:40:10'),('a4605c01-29fb-11f1-97b2-6c02e0d26821','6d69724c-2842-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-27 18:40:19','2026-03-27 18:40:19'),('b3310b8a-2a8e-11f1-97b2-6c02e0d26821','5a40313e-2a8e-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:31:53','2026-03-28 13:13:17'),('c2dbb7a5-2a8e-11f1-97b2-6c02e0d26821','5a40313e-2a8e-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:31:55','2026-03-28 13:28:50'),('c764530e-2c03-11f1-9455-00090ffe0001','1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',0,0.00,'2026-03-30 09:43:51',NULL),('e4bfa341-2ab4-11f1-97b2-6c02e0d26821','e2010964-2ab4-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:46:46','2026-03-28 17:46:33'),('eb2a64f0-2ab4-11f1-97b2-6c02e0d26821','e2010964-2ab4-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:46:40','2026-03-28 17:46:37'),('f0ef50ca-2ab4-11f1-97b2-6c02e0d26821','e2010964-2ab4-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:46:44','2026-03-28 17:46:46');
UNLOCK TABLES;
--
-- Table structure for table `module`
--
DROP TABLE IF EXISTS `module`;
CREATE TABLE `module` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,  `orderNumber` int NOT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  UNIQUE KEY `unique_order` (`courseId`,`orderNumber`),  CONSTRAINT `module_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `module`
--
LOCK TABLES `module` WRITE;
INSERT INTO `module` VALUES ('603620ee-20b0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Python Basics','-Python Syntax and Indentation\n-Variables and Data Types\n-Numbers and Mathematical Operations\n-Strings and String Manipulation\n-Comments and Code Readability\n-Input and Output in Python',2,'2026-03-15 22:48:52','2026-03-15 22:48:52'),('7c0ea9ec-2079-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Introduction to Python','-What is Python?\n-History and Features of Python\n-Installing Python and Setting Up the Environment\n-Writing Your First Python Program\n-Understanding the Python Interpreter\n-Python IDEs (VS Code, PyCharm, Jupyter)',1,'2026-03-15 16:15:56','2026-03-15 21:55:53'),('a2e67e29-2840-11f1-97b2-6c02e0d26821','8398c88d-2840-11f1-97b2-6c02e0d26821','chapter 1',NULL,1,'2026-03-25 13:49:10','2026-03-25 13:49:10');
UNLOCK TABLES;
--
-- Table structure for table `passwordresettoken`
--
DROP TABLE IF EXISTS `passwordresettoken`;
CREATE TABLE `passwordresettoken` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `userId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `expiresAt` datetime NOT NULL,  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  PRIMARY KEY (`id`),  UNIQUE KEY `token` (`token`),  KEY `userId` (`userId`),  CONSTRAINT `passwordresettoken_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `passwordresettoken`
--
LOCK TABLES `passwordresettoken` WRITE;
INSERT INTO `passwordresettoken` VALUES ('0a8f4f0a-19bc-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','6a7fa43c3fabcfb5f124715628d126aacfeec302a273f26829fc7ed9b1d82736','2026-03-07 03:24:45','2026-03-07 02:24:44');
UNLOCK TABLES;
--
-- Table structure for table `role`
--
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  PRIMARY KEY (`id`),  UNIQUE KEY `name` (`name`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `role`
--
LOCK TABLES `role` WRITE;
INSERT INTO `role` VALUES ('3ea888ae-18fa-11f1-97b2-6c02e0d26821','admin'),('3ea8c854-18fa-11f1-97b2-6c02e0d26821','student'),('3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','teacher');
UNLOCK TABLES;
--
-- Table structure for table `user`
--
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `roleId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `fullName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `passwordHash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `providerId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,  PRIMARY KEY (`id`),  UNIQUE KEY `email` (`email`),  KEY `idx_roleId` (`roleId`),  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Dumping data for table `user`
--
LOCK TABLES `user` WRITE;
INSERT INTO `user` VALUES ('32546860-1bab-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','╪د┘╪د╪ة ┘╪د╪╡╪▒ ╪ص╪│┘è┘ ╪»┘è╪▒┘è','s12216968@stu.najah.edu','$2b$10$DCwJfzOsPdby6dywv4dcDupd/I0TbOEpDrdyl/y.7/giGAQnLajT6','active','2026-03-09 13:29:12','2026-03-09 13:30:55',NULL,NULL,NULL),('3def91a4-1bac-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Lana Nasser','lana@gmail.com','$2b$10$5MzMd7PX/ER8.Oex7K/f7.eumaJOZ9HyxAGdARe/yk3e2dfc2fn8m','active','2026-03-09 13:36:41','2026-03-09 13:36:41',NULL,NULL,NULL),('437c1b23-1bab-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','alaa-dere','199634564@users.noreply.github.com','$2b$10$1LSMy1sh3Eus.WJJx14WK.stN0g2Ogd/js1.GAVuWAHzcVabmAJiW','active','2026-03-09 13:29:41','2026-03-09 13:29:41',NULL,NULL,NULL),('57967169-2842-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Nour','nour@gmail.com','$2b$10$g/f9zJKnDgwBfRjRadlDQemLs1V/lzt0EwihfjDRP1R46d5SHpzTe','active','2026-03-25 14:01:22','2026-03-27 21:43:11',NULL,NULL,'/uploads/profiles/57967169-2842-11f1-97b2-6c02e0d26821-1774628711500.jpg'),('955acab2-18fd-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Masa Ahmad','masa@gmail.com','$2b$10$/J3r8QXTAiDs1phDaHR2P.hasx1SEbyXHH.hDtom.e9ooSlHj8rtW','active','2026-03-06 03:41:23','2026-03-06 03:41:23',NULL,NULL,NULL),('a3891b1e-1bab-11f1-97b2-6c02e0d26821','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Batool Jamoos','batool@gmail.com','$2b$10$7pJyEGfW2u7lHboeiLjKLuHaKDDGRZms4w9lDamQvkcp9G5AwnteO','active','2026-03-09 13:32:22','2026-03-09 13:32:22',NULL,NULL,NULL),('b6c714e4-1bab-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Doaa Zaid','doaa@gmail.com','$2b$10$pvuwD7JVGjsklY5Is.0t8.NK.pnYJpL/AUv/xDxbCJOvxY2S4GzSi','active','2026-03-09 13:32:54','2026-03-09 13:32:54',NULL,NULL,NULL),('ba9e888a-18fc-11f1-97b2-6c02e0d26821','3ea888ae-18fa-11f1-97b2-6c02e0d26821','Administrator','admin@aivora.com','$2b$10$p08Ik85M4xCoxXgT.ytImecBZkNAoC4hE3LkjSehr2tCaIlQNiXRi','active','2026-03-06 03:35:16','2026-03-06 03:35:16',NULL,NULL,NULL),('c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','omar','omar@gmail.com','$2b$10$Upb8quxm5s16A4u05zX/AuzEsdokDrc9MV4E1Tufr3XuLTvh2/7X2','active','2026-03-28 13:06:27','2026-03-28 13:06:27',NULL,NULL,NULL),('ceb02830-1a95-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','alaa dere','alaadere35@gmail.com','$2b$10$24Canx/msOcoofDNgbB9POrkM/AFg2Q/aT5mWyCkt9LyTFppq7Jeu','active','2026-03-08 04:23:34','2026-03-27 18:17:07',NULL,NULL,'/uploads/profiles/ceb02830-1a95-11f1-97b2-6c02e0d26821-1774628218946.png'),('f1779632-1905-11f1-97b2-6c02e0d26821','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Manal AbuZayed','manal123@gmail.com','$2b$10$i3uOpUvGEMVd0SdBDVLnXOay8XfhyHoxQFrSfAFnF0O0wvcRnA2tO','active','2026-03-06 04:41:14','2026-03-06 04:41:14',NULL,NULL,NULL),('f74bdb60-2acf-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','meme','meme@gmail.com','$2b$10$YrFpC853zozdPsSV7ZwgXuf3.G9NgQRLcWIQONrQdEPvQ2ILH6Y0W','active','2026-03-28 21:00:12','2026-03-28 21:00:12',NULL,NULL,NULL),('fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','ola abdo','ola@gmail.com','$2b$10$Uv706CBB8H7y5EHRy0vGEuO0w7GLfD.m/VAtl.yXjuB74Bf.K9Ipu','active','2026-03-28 21:07:30','2026-03-30 09:57:19',NULL,NULL,'/uploads/profiles/fcaa82e7-2ad0-11f1-97b2-6c02e0d26821-1774853829824.jfif');
UNLOCK TABLES;
-- Dump completed on 2026-03-30 12:09:14



SET FOREIGN_KEY_CHECKS=1;

