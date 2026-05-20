-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: aivora_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_notification`
--

DROP TABLE IF EXISTS `admin_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notification` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('student_signup','course_enroll') COLLATE utf8mb4_unicode_ci DEFAULT 'student_signup',
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `studentId` (`studentId`),
  KEY `courseId` (`courseId`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_readAt` (`readAt`),
  KEY `idx_type` (`type`),
  CONSTRAINT `admin_notification_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `admin_notification_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notification`
--

LOCK TABLES `admin_notification` WRITE;
/*!40000 ALTER TABLE `admin_notification` DISABLE KEYS */;
INSERT INTO `admin_notification` VALUES ('0f1abb5f-2d48-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 00:24:53',NULL),('16be8c0f-15ae-4af3-9ac9-e6415040bf6e','course_enroll','Quiz passed','talia passed the quiz for Python Programming with 100.00% (attempt #1).','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 21:15:04','2026-03-31 21:15:49'),('19dad7d6-5cb0-41c5-ad1c-ba78d43ff1cb','course_enroll','Certificate unlocked','nasser unlocked the certificate for Python Programming.','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:16:50',NULL),('1ce99c17-2ad1-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 21:08:24','2026-03-31 20:11:43'),('340202b1-2d42-11f1-97b2-6c02e0d26821','student_signup','New Student Account','╪د┘╪د╪ة ┘╪د╪╡╪▒ ╪ص╪│┘è┘ ╪»┘è╪▒┘è created a student account.','33fe4baa-2d42-11f1-97b2-6c02e0d26821',NULL,'2026-03-31 23:42:58',NULL),('47c90b63-2d46-11f1-97b2-6c02e0d26821','student_signup','New Student Account','nasser created a student account.','47c1d5ab-2d46-11f1-97b2-6c02e0d26821',NULL,'2026-04-01 00:12:10',NULL),('4948cc6e-b0c6-4505-87bd-e59a705da9a8','course_enroll','Certificate unlocked after retake','toto retook the quiz and unlocked the certificate for Python Programming.','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:23:35',NULL),('59908d03-2d2d-11f1-97b2-6c02e0d26821','student_signup','New Student Account','talia created a student account.','598cdd8a-2d2d-11f1-97b2-6c02e0d26821',NULL,'2026-03-31 21:13:42',NULL),('5d380024-2d42-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 23:44:08',NULL),('6726c403-e5fe-4e7a-8a91-ee740265d95d','course_enroll','Certificate unlocked','talia unlocked the certificate for Python Programming.','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 21:15:04','2026-03-31 21:15:48'),('679630ff-c6b3-4bf3-9f83-65273f766a83','course_enroll','Quiz failed','toto failed the quiz for Python Programming with 40.00% (attempt #1).','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:22:57',NULL),('698e3976-2d2d-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 21:14:09',NULL),('79ebb8b6-d686-4f45-b540-10e408b3dc86','course_enroll','Quiz passed','alaa-dere passed the quiz for Python Programming with 60.00% (attempt #1).','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 20:26:47','2026-03-31 21:09:19'),('820d89f2-2c26-11f1-97b2-6c02e0d26821','student_signup','New Student Account','jihad created a student account.','820b3b3c-2c26-11f1-97b2-6c02e0d26821',NULL,'2026-03-30 13:52:12','2026-03-31 20:11:34'),('8d7646cb-1530-40b4-8a03-e56df0f2aa19','course_enroll','New course evaluation','toto rated \"Python Programming\" 5/5. Feedback: \"amaaaaaaaaaaaaaaaaaizing course\"','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:24:00',NULL),('9fd43ec5-2c35-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-30 15:40:25','2026-03-31 20:11:34'),('c142ff9e-7508-4d28-99a8-3bbf960c7b02','course_enroll','Quiz passed','toto passed the quiz for Python Programming with 80.00% (attempt #2).','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:23:35',NULL),('cebbebd7-5dec-4046-80f4-5c43269f8a17','course_enroll','Quiz passed','nasser passed the quiz for Python Programming with 70.00% (attempt #1).','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:16:50',NULL),('d5ab3250-a202-452c-8be3-c59641390c48','course_enroll','Quiz passed','╪د┘╪د╪ة ┘╪د╪╡╪▒ ╪ص╪│┘è┘ ╪»┘è╪▒┘è passed the quiz for Python Programming with 80.00% (attempt #1).',NULL,'4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 20:40:59','2026-03-31 21:09:19'),('e01d9b49-2d4f-11f1-97b2-6c02e0d26821','student_signup','New Student Account','toto created a student account.','e0183a49-2d4f-11f1-97b2-6c02e0d26821',NULL,'2026-04-01 01:20:51',NULL),('f1d7a562-2d4f-11f1-97b2-6c02e0d26821','course_enroll','New Enrollment','Student enrolled in course 4f0dd6ed-2076-11f1-97b2-6c02e0d26821.','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:21:20',NULL),('f75262de-2acf-11f1-97b2-6c02e0d26821','student_signup','New Student Account','meme created a student account.','f74bdb60-2acf-11f1-97b2-6c02e0d26821',NULL,'2026-03-28 21:00:12','2026-03-31 20:11:46'),('fcac2ea2-2ad0-11f1-97b2-6c02e0d26821','student_signup','New Student Account','ola abdo created a student account.','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',NULL,'2026-03-28 21:07:30','2026-03-31 20:11:38');
/*!40000 ALTER TABLE `admin_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_teacher_message`
--

DROP TABLE IF EXISTS `admin_teacher_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_teacher_message` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `threadId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderRole` enum('admin','teacher') COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  `deletedForAdminAt` datetime DEFAULT NULL,
  `deletedForTeacherAt` datetime DEFAULT NULL,
  `deletedForEveryoneAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_threadId` (`threadId`),
  KEY `idx_senderId` (`senderId`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_readAt` (`readAt`),
  KEY `idx_admin_teacher_deleted_everyone` (`deletedForEveryoneAt`),
  KEY `idx_admin_teacher_deleted_admin` (`deletedForAdminAt`),
  KEY `idx_admin_teacher_deleted_teacher` (`deletedForTeacherAt`),
  CONSTRAINT `admin_teacher_message_ibfk_1` FOREIGN KEY (`threadId`) REFERENCES `admin_teacher_thread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_teacher_message_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_teacher_message`
--

LOCK TABLES `admin_teacher_message` WRITE;
/*!40000 ALTER TABLE `admin_teacher_message` DISABLE KEYS */;
INSERT INTO `admin_teacher_message` VALUES ('19774ee7-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','hiiiiiiiiiiiiiiiiiiiiiiii','2026-03-29 21:07:07','2026-03-29 21:08:07',NULL,NULL,NULL),('1d825330-2b93-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','?','2026-03-29 20:17:08','2026-03-29 20:18:02',NULL,NULL,NULL),('2ec89cbd-2acb-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hello','2026-03-28 20:25:57','2026-03-28 20:45:18',NULL,NULL,NULL),('4d36ccb6-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','dont worry','2026-03-29 20:32:47','2026-03-29 20:33:46',NULL,NULL,NULL),('4f095bf7-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','azewg','2026-03-29 20:32:50','2026-03-29 20:33:46','2026-03-29 20:32:52',NULL,NULL),('5f3df49c-2b91-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','i want to ask about salary','2026-03-29 20:04:39','2026-03-29 20:07:09',NULL,NULL,NULL),('79f8aaef-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','what??','2026-03-29 20:34:02','2026-03-29 20:39:21',NULL,NULL,NULL),('7f9bf662-2b95-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','fyjufvg','2026-03-29 20:34:11','2026-03-29 20:39:21',NULL,NULL,'2026-03-29 20:34:15'),('9c37a740-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','hi teacher','2026-03-29 21:10:47','2026-03-29 21:11:25',NULL,NULL,NULL),('a054f545-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','rgaeslknhjg','2026-03-29 21:10:54','2026-03-29 21:11:25',NULL,NULL,'2026-03-29 21:11:00'),('a108878a-2b98-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hi','2026-03-29 20:56:36','2026-03-29 21:06:57',NULL,NULL,NULL),('a2b7adf7-2b91-11f1-97b2-6c02e0d26821','a2b54e72-2b91-11f1-97b2-6c02e0d26821','a3891b1e-1bab-11f1-97b2-6c02e0d26821','teacher','hi admin','2026-03-29 20:06:32','2026-03-29 20:07:07',NULL,NULL,NULL),('a8bdfdd8-2b9a-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','sorry','2026-03-29 21:11:08','2026-03-29 21:11:25','2026-03-29 21:11:10',NULL,NULL),('f456d7f8-2aca-11f1-97b2-6c02e0d26821','f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','admin','hi','2026-03-28 20:24:19','2026-03-28 20:25:47',NULL,NULL,NULL);
/*!40000 ALTER TABLE `admin_teacher_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_teacher_thread`
--

DROP TABLE IF EXISTS `admin_teacher_thread`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_teacher_thread` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adminId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `lastMessageAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_thread` (`adminId`,`teacherId`),
  KEY `idx_adminId` (`adminId`),
  KEY `idx_teacherId` (`teacherId`),
  KEY `idx_lastMessageAt` (`lastMessageAt`),
  CONSTRAINT `admin_teacher_thread_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_teacher_thread_ibfk_2` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_teacher_thread`
--

LOCK TABLES `admin_teacher_thread` WRITE;
/*!40000 ALTER TABLE `admin_teacher_thread` DISABLE KEYS */;
INSERT INTO `admin_teacher_thread` VALUES ('a2b54e72-2b91-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','a3891b1e-1bab-11f1-97b2-6c02e0d26821','2026-03-29 20:06:32','2026-03-29 20:07:38'),('f44f2075-2aca-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 20:24:19','2026-03-29 21:11:08');
/*!40000 ALTER TABLE `admin_teacher_thread` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificate`
--

DROP TABLE IF EXISTS `certificate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificateNo` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `issuedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_course` (`studentId`,`courseId`),
  UNIQUE KEY `unique_certificate_no` (`certificateNo`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_courseId` (`courseId`),
  CONSTRAINT `certificate_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `certificate_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificate`
--

LOCK TABLES `certificate` WRITE;
/*!40000 ALTER TABLE `certificate` DISABLE KEYS */;
INSERT INTO `certificate` VALUES ('12abda36-a7f3-4cd4-98b8-c58a54e0161d','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260330-12ABDA','2026-03-30 15:42:49','2026-03-30 15:42:49','2026-03-30 15:42:49'),('57fe6bab-38cb-4863-a562-ffef4b3b1599','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260331-57FE6B','2026-03-31 20:26:47','2026-03-31 20:26:47','2026-03-31 20:26:47'),('727e81f5-8825-4e3a-8555-e2d86a0926f1','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260331-727E81','2026-04-01 01:23:35','2026-04-01 01:23:35','2026-04-01 01:23:35'),('7df61932-c269-493c-a8d1-ae21f50a2b0b','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260330-7DF619','2026-03-30 14:01:31','2026-03-30 14:01:31','2026-03-30 14:01:31'),('91ff8d22-f9ab-4a7a-92b5-5457d16d2a84','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260331-91FF8D','2026-03-31 21:15:04','2026-03-31 21:15:04','2026-03-31 21:15:04'),('96504f5f-43da-49be-939e-839208500769','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260331-96504F','2026-04-01 01:16:50','2026-04-01 01:16:50','2026-04-01 01:16:50'),('a46756a6-29fb-11f1-97b2-6c02e0d26821','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','AIV-PP-20260327-A46756','2026-03-27 18:40:19','2026-03-27 18:40:19','2026-03-27 18:40:19');
/*!40000 ALTER TABLE `certificate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversation`
--

DROP TABLE IF EXISTS `chat_conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversation` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_course_student_teacher` (`courseId`,`studentId`,`teacherId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_teacherId` (`teacherId`),
  KEY `idx_courseId` (`courseId`),
  CONSTRAINT `chat_conversation_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_conversation_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_conversation_ibfk_3` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversation`
--

LOCK TABLES `chat_conversation` WRITE;
/*!40000 ALTER TABLE `chat_conversation` DISABLE KEYS */;
INSERT INTO `chat_conversation` VALUES ('26e74541-2ac1-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 19:14:09','2026-03-28 19:14:09'),('5752e01e-2abf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','955acab2-18fd-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 19:01:11','2026-03-28 19:01:11'),('78b36abc-2acc-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-28 20:35:11','2026-03-28 20:35:11'),('b33082ec-2b99-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','b6c714e4-1bab-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-29 21:04:16','2026-03-29 21:04:16'),('ba8cb338-2b9a-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f74bdb60-2acf-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','2026-03-29 21:11:37','2026-03-29 21:11:37');
/*!40000 ALTER TABLE `chat_conversation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversationId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderRole` enum('student','teacher') COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  `deletedForStudentAt` datetime DEFAULT NULL,
  `deletedForTeacherAt` datetime DEFAULT NULL,
  `deletedForEveryoneAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conversationId` (`conversationId`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_senderId` (`senderId`),
  KEY `idx_readAt` (`readAt`),
  KEY `idx_chat_deleted_everyone` (`deletedForEveryoneAt`),
  KEY `idx_chat_deleted_student` (`deletedForStudentAt`),
  KEY `idx_chat_deleted_teacher` (`deletedForTeacherAt`),
  CONSTRAINT `chat_message_ibfk_1` FOREIGN KEY (`conversationId`) REFERENCES `chat_conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_message`
--

LOCK TABLES `chat_message` WRITE;
/*!40000 ALTER TABLE `chat_message` DISABLE KEYS */;
INSERT INTO `chat_message` VALUES ('190882d6-2acc-11f1-97b2-6c02e0d26821','26e74541-2ac1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','student','hi','2026-03-28 20:32:30','2026-03-29 19:56:05',NULL,NULL,NULL),('1eeebfec-2acc-11f1-97b2-6c02e0d26821','26e74541-2ac1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','student','helloooooooooowwwwwwwwwwwww','2026-03-28 20:32:40','2026-03-29 19:56:05',NULL,NULL,NULL),('2fefa71e-2ac1-11f1-97b2-6c02e0d26821','26e74541-2ac1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','student','hello teacher','2026-03-28 19:14:24','2026-03-29 19:56:05',NULL,NULL,NULL),('4d56a1e6-2bbe-11f1-97b2-6c02e0d26821','ba8cb338-2b9a-11f1-97b2-6c02e0d26821','f74bdb60-2acf-11f1-97b2-6c02e0d26821','student','hi','2026-03-30 01:26:16','2026-03-31 20:13:01',NULL,NULL,NULL),('5f39d0d3-2abf-11f1-97b2-6c02e0d26821','5752e01e-2abf-11f1-97b2-6c02e0d26821','955acab2-18fd-11f1-97b2-6c02e0d26821','student','hi teacher','2026-03-28 19:01:24','2026-03-29 20:22:26',NULL,NULL,NULL),('820aa38f-2acc-11f1-97b2-6c02e0d26821','78b36abc-2acc-11f1-97b2-6c02e0d26821','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','student','i want to ask a question','2026-03-28 20:35:26','2026-03-29 20:33:30',NULL,NULL,NULL),('b5dcb073-2b99-11f1-97b2-6c02e0d26821','b33082ec-2b99-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hi','2026-03-29 21:04:20',NULL,NULL,NULL,NULL),('be1935c1-2b9a-11f1-97b2-6c02e0d26821','ba8cb338-2b9a-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','teacher','hi meme','2026-03-29 21:11:43',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `chat_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course`
--

DROP TABLE IF EXISTS `course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `descriptionAr` text COLLATE utf8mb4_unicode_ci,
  `teacherId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `teacherSharePct` int DEFAULT '60',
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durationWeeks` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_teacherId` (`teacherId`),
  CONSTRAINT `course_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course`
--

LOCK TABLES `course` WRITE;
/*!40000 ALTER TABLE `course` DISABLE KEYS */;
INSERT INTO `course` VALUES ('4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Python Programming','This course introduces learners to the fundamentals of Python programming, one of the most widely used programming languages in software development, data science, artificial intelligence, and automation. Students will learn programming concepts such as variables, control structures, functions, and object-oriented programming while developing practical programs and solving real-world problems. The course gradually progresses from basic syntax to advanced concepts like file handling, modules, and working with external libraries.

Python is known for its simple syntax, readability, and large ecosystem of libraries, making it an ideal language for beginners and professionals alike. By the end of this course, students will be able to write efficient Python programs and apply programming skills in various applications.',NULL,'f1779632-1905-11f1-97b2-6c02e0d26821',20.00,60,'published','2026-03-15 15:53:12','2026-04-01 00:58:55','/uploads/courses/course-4f0dd6ed-2076-11f1-97b2-6c02e0d26821-1773615294920.webp',3),('8398c88d-2840-11f1-97b2-6c02e0d26821','web development','important course',NULL,'a3891b1e-1bab-11f1-97b2-6c02e0d26821',40.00,70,'archived','2026-03-25 13:48:17','2026-03-25 13:48:17',NULL,6);
/*!40000 ALTER TABLE `course` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_evaluation`
--

DROP TABLE IF EXISTS `course_evaluation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_evaluation` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` tinyint unsigned DEFAULT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `skippedAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_course_evaluation_student` (`courseId`,`studentId`),
  KEY `idx_course_evaluation_course` (`courseId`),
  KEY `idx_course_evaluation_rating` (`rating`),
  KEY `idx_course_evaluation_created` (`createdAt`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `course_evaluation_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_evaluation_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_evaluation`
--

LOCK TABLES `course_evaluation` WRITE;
/*!40000 ALTER TABLE `course_evaluation` DISABLE KEYS */;
INSERT INTO `course_evaluation` VALUES ('70528380-985a-4d98-896e-e35f6fd5e4d4','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821',5,'amaaaaaaaaaaaaaaaaaizing course',NULL,'2026-04-01 01:24:00','2026-04-01 01:24:00'),('add46b76-efa5-4d33-a8fd-d86aa463b89c','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','47c1d5ab-2d46-11f1-97b2-6c02e0d26821',4,'i realy improve my skils i love it',NULL,'2026-04-01 01:17:53','2026-04-01 01:17:53');
/*!40000 ALTER TABLE `course_evaluation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_question_bank`
--

DROP TABLE IF EXISTS `course_question_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_question_bank` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `questionType` enum('multiple_choice','written','true_false') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'multiple_choice',
  `questionText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `optionsJson` json NOT NULL,
  `correctOptionIndex` tinyint unsigned NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courseId` (`courseId`),
  KEY `idx_teacherId` (`teacherId`),
  CONSTRAINT `course_question_bank_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_question_bank_ibfk_2` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_question_bank`
--

LOCK TABLES `course_question_bank` WRITE;
/*!40000 ALTER TABLE `course_question_bank` DISABLE KEYS */;
INSERT INTO `course_question_bank` VALUES ('35c39823-2c24-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',0,'2026-03-30 13:35:45','2026-03-30 13:35:45'),('35d01991-2c24-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','Which of the following is a mutable data type in Python?','[\"A) tuple\", \"B) str\", \"C) list\", \"D) int\"]',2,'2026-03-30 13:35:45','2026-03-30 13:35:45'),('35d9af7f-2c24-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','What does the len() function do?','[\"A) Returns the number of characters in a string\", \"B) Returns the number of items in a sequence\", \"C) Returns the length of a list, tuple, dict, or string\", \"D) All of the above\"]',3,'2026-03-30 13:35:45','2026-03-30 13:35:45'),('382eb868-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',2,'2026-03-30 13:50:08','2026-03-30 13:50:08'),('38376d50-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of this snippet?\nprint(\"Hello\" + str(5))','[\"A) Hello\", \"B) Hello5\", \"C) Error\", \"D) 5Hello\"]',1,'2026-03-30 13:50:08','2026-03-30 13:50:08'),('383cd882-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','How do you import the math module?','[\"A) import math\", \"B) from math import *\", \"C) import math as m\", \"D) All of the above\"]',3,'2026-03-30 13:50:08','2026-03-30 13:50:08'),('8e543e86-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','Python is a statically typed language.','[\"True\", \"False\"]',1,'2026-03-30 15:32:46','2026-03-30 15:32:46'),('e2f83c17-2c25-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',2,'2026-03-30 13:47:45','2026-03-30 13:47:45'),('e300e22b-2c25-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','What is the correct way to write a function in Python?','[\"A) function my_func():\", \"B) def my_func():\", \"C) func my_func():\", \"D) declare my_func():\"]',1,'2026-03-30 13:47:45','2026-03-30 13:47:45'),('e3078f58-2c25-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','Which keyword is used to handle exceptions?','[\"A) try\", \"B) catch\", \"C) except\", \"D) Both A and C\"]',3,'2026-03-30 13:47:45','2026-03-30 13:47:45'),('e30d7a86-2c25-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following list comprehension?\n[i for i in range(5) if i % 2 == 0]','[\"A) [1, 3]\", \"B) [0, 1, 2, 3, 4]\", \"C) [0, 2, 4]\", \"D) [2, 4]\"]',2,'2026-03-30 13:47:45','2026-03-30 13:47:45'),('ed5c8b6c-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','Lists in Python are mutable.','[\"True\", \"False\"]',0,'2026-03-30 15:35:25','2026-03-30 15:35:25'),('ed62e27f-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','A tuple can be modified after it is created.','[\"True\", \"False\"]',1,'2026-03-30 15:35:25','2026-03-30 15:35:25'),('ed6a6550-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','The len() function can be used on strings, lists, and dictionaries.','[\"True\", \"False\"]',0,'2026-03-30 15:35:25','2026-03-30 15:35:25'),('ed71610c-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','Python uses indentation to define code blocks.','[\"True\", \"False\"]',0,'2026-03-30 15:35:25','2026-03-30 15:35:25'),('ed771211-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','The keyword elif means \"else if\".','[\"True\", \"False\"]',0,'2026-03-30 15:35:25','2026-03-30 15:35:25'),('ed800e11-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','You must declare variable types before using them in Python.','[\"True\", \"False\"]',1,'2026-03-30 15:35:25','2026-03-30 15:35:25'),('ed86ac2d-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','Dictionaries store data in key-value pairs.','[\"True\", \"False\"]',0,'2026-03-30 15:35:26','2026-03-30 15:35:26'),('ed8d917d-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','The expression 5 / 2 in Python returns 2.','[\"True\", \"False\"]',1,'2026-03-30 15:35:26','2026-03-30 15:35:26'),('ed955742-2c34-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','true_false','print() is used to display output in Python.','[\"True\", \"False\"]',0,'2026-03-30 15:35:26','2026-03-30 15:35:26');
/*!40000 ALTER TABLE `course_question_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_quiz_attempt`
--

DROP TABLE IF EXISTS `course_quiz_attempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_quiz_attempt` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalQuestions` int NOT NULL,
  `correctAnswers` int NOT NULL,
  `scorePercentage` decimal(5,2) NOT NULL,
  `submittedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courseId` (`courseId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_submittedAt` (`submittedAt`),
  CONSTRAINT `course_quiz_attempt_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_quiz_attempt_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_quiz_attempt`
--

LOCK TABLES `course_quiz_attempt` WRITE;
/*!40000 ALTER TABLE `course_quiz_attempt` DISABLE KEYS */;
INSERT INTO `course_quiz_attempt` VALUES ('1626a0fc-6314-4ce4-9196-1dfce94a5d55','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','820b3b3c-2c26-11f1-97b2-6c02e0d26821',10,3,30.00,'2026-03-30 15:41:25','2026-03-30 15:41:25'),('694d031f-8f64-44b7-8718-edc3b93c2d4b','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',10,9,90.00,'2026-03-30 14:01:31','2026-03-30 14:01:31'),('79ad8dff-7d59-4aa9-9c91-3438b360d5dc','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','598cdd8a-2d2d-11f1-97b2-6c02e0d26821',10,10,100.00,'2026-03-31 21:15:04','2026-03-31 21:15:04'),('946a3cdd-0581-44a3-b7d1-f84d3479e0a6','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821',10,8,80.00,'2026-04-01 01:23:35','2026-04-01 01:23:35'),('d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','437c1b23-1bab-11f1-97b2-6c02e0d26821',10,6,60.00,'2026-03-31 20:26:47','2026-03-31 20:26:47'),('d8b82f5d-22a4-430c-9c52-3ad69a878787','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821',10,4,40.00,'2026-04-01 01:22:57','2026-04-01 01:22:57'),('eeeb9e09-4317-4822-bd77-0d06e054dcb6','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','47c1d5ab-2d46-11f1-97b2-6c02e0d26821',10,7,70.00,'2026-04-01 01:16:50','2026-04-01 01:16:50'),('ff7bc55c-ab03-4905-8aac-79c9b1771232','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','820b3b3c-2c26-11f1-97b2-6c02e0d26821',10,7,70.00,'2026-03-30 15:42:49','2026-03-30 15:42:49');
/*!40000 ALTER TABLE `course_quiz_attempt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_quiz_attempt_answer`
--

DROP TABLE IF EXISTS `course_quiz_attempt_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_quiz_attempt_answer` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attemptId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `questionBankId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `questionType` enum('multiple_choice','written','true_false') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'multiple_choice',
  `questionText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `optionsJson` json NOT NULL,
  `selectedOptionIndex` tinyint DEFAULT NULL,
  `selectedTextAnswer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `correctOptionIndex` tinyint unsigned NOT NULL,
  `isCorrect` tinyint(1) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attemptId` (`attemptId`),
  KEY `idx_questionBankId` (`questionBankId`),
  CONSTRAINT `course_quiz_attempt_answer_ibfk_1` FOREIGN KEY (`attemptId`) REFERENCES `course_quiz_attempt` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_quiz_attempt_answer_ibfk_2` FOREIGN KEY (`questionBankId`) REFERENCES `course_question_bank` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_quiz_attempt_answer`
--

LOCK TABLES `course_quiz_attempt_answer` WRITE;
/*!40000 ALTER TABLE `course_quiz_attempt_answer` DISABLE KEYS */;
INSERT INTO `course_quiz_attempt_answer` VALUES ('065f93b4-4f8e-468f-bd87-7fe8d0026967','eeeb9e09-4317-4822-bd77-0d06e054dcb6','ed71610c-2c34-11f1-97b2-6c02e0d26821','true_false','Python uses indentation to define code blocks.','[\"True\", \"False\"]',0,NULL,0,1,'2026-04-01 01:16:50'),('080f0089-485f-4c7b-8bce-e19d6a20b862','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','ed71610c-2c34-11f1-97b2-6c02e0d26821','true_false','Python uses indentation to define code blocks.','[\"True\", \"False\"]',1,NULL,0,0,'2026-03-31 20:26:47'),('0e6b19a4-5aac-4a55-b855-3805edc9aedd','694d031f-8f64-44b7-8718-edc3b93c2d4b','35d9af7f-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What does the len() function do?','[\"A) Returns the number of characters in a string\", \"B) Returns the number of items in a sequence\", \"C) Returns the length of a list, tuple, dict, or string\", \"D) All of the above\"]',3,NULL,3,1,'2026-03-30 14:01:31'),('1efffc46-4efa-4c54-b2fa-aa0801cff9d2','d8b82f5d-22a4-430c-9c52-3ad69a878787','ed86ac2d-2c34-11f1-97b2-6c02e0d26821','true_false','Dictionaries store data in key-value pairs.','[\"True\", \"False\"]',1,NULL,0,0,'2026-04-01 01:22:57'),('2122276a-611b-4d96-b702-9690f776b120','1626a0fc-6314-4ce4-9196-1dfce94a5d55','382eb868-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',2,NULL,2,1,'2026-03-30 15:41:25'),('23a3c6d6-a4ed-4681-a5e5-7c9a2d0b4e64','694d031f-8f64-44b7-8718-edc3b93c2d4b','35d01991-2c24-11f1-97b2-6c02e0d26821','multiple_choice','Which of the following is a mutable data type in Python?','[\"A) tuple\", \"B) str\", \"C) list\", \"D) int\"]',2,NULL,2,1,'2026-03-30 14:01:31'),('2580599e-b974-4701-a951-9f65c72f0945','1626a0fc-6314-4ce4-9196-1dfce94a5d55','e300e22b-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the correct way to write a function in Python?','[\"A) function my_func():\", \"B) def my_func():\", \"C) func my_func():\", \"D) declare my_func():\"]',2,NULL,1,0,'2026-03-30 15:41:25'),('2a3b4154-0ddc-495d-b9d3-991197cec07e','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','38376d50-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of this snippet?\nprint(\"Hello\" + str(5))','[\"A) Hello\", \"B) Hello5\", \"C) Error\", \"D) 5Hello\"]',1,NULL,1,1,'2026-03-31 20:26:47'),('2b3ef3a9-cebb-40d7-ae1c-c6ae2d144704','eeeb9e09-4317-4822-bd77-0d06e054dcb6','ed6a6550-2c34-11f1-97b2-6c02e0d26821','true_false','The len() function can be used on strings, lists, and dictionaries.','[\"True\", \"False\"]',1,NULL,0,0,'2026-04-01 01:16:50'),('372940ff-2d98-4080-b374-c9516713c4e5','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','e2f83c17-2c25-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',2,NULL,2,1,'2026-04-01 01:23:35'),('3a74bcdf-d1e8-4ff4-8cd0-e654aba48fed','ff7bc55c-ab03-4905-8aac-79c9b1771232','382eb868-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',2,NULL,2,1,'2026-03-30 15:42:49'),('3a966b04-aad2-4f8f-9136-03621584ea85','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','ed6a6550-2c34-11f1-97b2-6c02e0d26821','true_false','The len() function can be used on strings, lists, and dictionaries.','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-31 21:15:04'),('4046e85d-c612-4fc1-9925-0e2bcba6bb2c','1626a0fc-6314-4ce4-9196-1dfce94a5d55','e30d7a86-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following list comprehension?\n[i for i in range(5) if i % 2 == 0]','[\"A) [1, 3]\", \"B) [0, 1, 2, 3, 4]\", \"C) [0, 2, 4]\", \"D) [2, 4]\"]',2,NULL,2,1,'2026-03-30 15:41:25'),('47174a9f-2e4a-4319-aeb9-d5c05112854f','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','ed771211-2c34-11f1-97b2-6c02e0d26821','true_false','The keyword elif means \"else if\".','[\"True\", \"False\"]',0,NULL,0,1,'2026-04-01 01:23:35'),('49ab42da-7812-4ce7-b338-99d1c08162a4','d8b82f5d-22a4-430c-9c52-3ad69a878787','ed62e27f-2c34-11f1-97b2-6c02e0d26821','true_false','A tuple can be modified after it is created.','[\"True\", \"False\"]',1,NULL,1,1,'2026-04-01 01:22:57'),('518542b2-27fb-4d1d-abcc-01b605efe4b6','1626a0fc-6314-4ce4-9196-1dfce94a5d55','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',0,NULL,0,1,'2026-03-30 15:41:25'),('535df707-2ef5-466b-ad0e-f7caaebe2ee8','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','ed86ac2d-2c34-11f1-97b2-6c02e0d26821','true_false','Dictionaries store data in key-value pairs.','[\"True\", \"False\"]',0,NULL,0,1,'2026-04-01 01:23:35'),('53d938dc-8dcb-4add-897d-6b65dc9d24ac','d8b82f5d-22a4-430c-9c52-3ad69a878787','e2f83c17-2c25-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',3,NULL,2,0,'2026-04-01 01:22:57'),('5480afee-8ab5-472a-a3fb-2b52dc26136d','694d031f-8f64-44b7-8718-edc3b93c2d4b','e300e22b-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the correct way to write a function in Python?','[\"A) function my_func():\", \"B) def my_func():\", \"C) func my_func():\", \"D) declare my_func():\"]',1,NULL,1,1,'2026-03-30 14:01:31'),('58fb194a-50cc-43c2-83ad-e2970d18054b','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','e3078f58-2c25-11f1-97b2-6c02e0d26821','multiple_choice','Which keyword is used to handle exceptions?','[\"A) try\", \"B) catch\", \"C) except\", \"D) Both A and C\"]',3,NULL,3,1,'2026-03-31 21:15:04'),('5d32d712-a33d-44ed-a0fb-9b00d05f2e63','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','8e543e86-2c34-11f1-97b2-6c02e0d26821','true_false','Python is a statically typed language.','[\"True\", \"False\"]',0,NULL,1,0,'2026-04-01 01:23:35'),('68fe9519-5a3c-49d3-bcdf-4f5a83737f57','ff7bc55c-ab03-4905-8aac-79c9b1771232','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',1,NULL,0,0,'2026-03-30 15:42:49'),('6d011127-8bf5-4025-a13a-b38cafaf4dfb','d8b82f5d-22a4-430c-9c52-3ad69a878787','ed800e11-2c34-11f1-97b2-6c02e0d26821','true_false','You must declare variable types before using them in Python.','[\"True\", \"False\"]',1,NULL,1,1,'2026-04-01 01:22:57'),('7099cab0-143f-43c5-9e13-fa815477816e','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','382eb868-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',2,NULL,2,1,'2026-03-31 21:15:04'),('71dfec23-4ee4-4e40-a6a6-6eb1583b59f4','1626a0fc-6314-4ce4-9196-1dfce94a5d55','383cd882-2c26-11f1-97b2-6c02e0d26821','multiple_choice','How do you import the math module?','[\"A) import math\", \"B) from math import *\", \"C) import math as m\", \"D) All of the above\"]',2,NULL,3,0,'2026-03-30 15:41:25'),('73b6d28d-16db-44e8-9b54-a4520b74fef5','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','ed800e11-2c34-11f1-97b2-6c02e0d26821','true_false','You must declare variable types before using them in Python.','[\"True\", \"False\"]',0,NULL,1,0,'2026-04-01 01:23:35'),('7cda2206-d62f-41af-892d-3a5cf1b971d9','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','8e543e86-2c34-11f1-97b2-6c02e0d26821','true_false','Python is a statically typed language.','[\"True\", \"False\"]',0,NULL,1,0,'2026-03-31 20:26:47'),('7d6be338-8ac3-4696-a94d-8451f4ecde4a','d8b82f5d-22a4-430c-9c52-3ad69a878787','382eb868-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',3,NULL,2,0,'2026-04-01 01:22:57'),('7dd5238a-fabf-42f3-ba9b-adf3353a381f','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','e300e22b-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the correct way to write a function in Python?','[\"A) function my_func():\", \"B) def my_func():\", \"C) func my_func():\", \"D) declare my_func():\"]',1,NULL,1,1,'2026-04-01 01:23:35'),('7f288399-bc77-4390-b279-1a8c4f96f3fa','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','382eb868-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',2,NULL,2,1,'2026-03-31 20:26:47'),('89b5ad64-b86b-400a-a468-ab1f6ce9e052','eeeb9e09-4317-4822-bd77-0d06e054dcb6','e30d7a86-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following list comprehension?\n[i for i in range(5) if i % 2 == 0]','[\"A) [1, 3]\", \"B) [0, 1, 2, 3, 4]\", \"C) [0, 2, 4]\", \"D) [2, 4]\"]',2,NULL,2,1,'2026-04-01 01:16:50'),('8a1a6edf-c66d-498d-8d8a-413e6376a447','ff7bc55c-ab03-4905-8aac-79c9b1771232','ed955742-2c34-11f1-97b2-6c02e0d26821','true_false','print() is used to display output in Python.','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-30 15:42:49'),('8ba11cf0-120b-4eb4-8727-12b62cb4ad04','ff7bc55c-ab03-4905-8aac-79c9b1771232','38376d50-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of this snippet?\nprint(\"Hello\" + str(5))','[\"A) Hello\", \"B) Hello5\", \"C) Error\", \"D) 5Hello\"]',1,NULL,1,1,'2026-03-30 15:42:49'),('8d71a167-c4e5-4637-bcbc-0321b26c7575','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','ed955742-2c34-11f1-97b2-6c02e0d26821','true_false','print() is used to display output in Python.','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-31 20:26:47'),('8fce25c0-c266-41f5-b349-3da1d56514e7','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','e2f83c17-2c25-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',2,NULL,2,1,'2026-03-31 21:15:04'),('90ccf527-ee40-463b-b08d-1a3a80c868a5','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',0,NULL,0,1,'2026-03-31 21:15:04'),('92e954b3-220d-4be0-a4d9-b370cb67ec2c','1626a0fc-6314-4ce4-9196-1dfce94a5d55','e2f83c17-2c25-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',1,NULL,2,0,'2026-03-30 15:41:25'),('93e47c7c-8a3f-43b2-9ed6-05a768340969','ff7bc55c-ab03-4905-8aac-79c9b1771232','ed5c8b6c-2c34-11f1-97b2-6c02e0d26821','true_false','Lists in Python are mutable.','[\"True\", \"False\"]',1,NULL,0,0,'2026-03-30 15:42:49'),('97e6232d-5d11-4a73-a682-cac398a46590','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','ed5c8b6c-2c34-11f1-97b2-6c02e0d26821','true_false','Lists in Python are mutable.','[\"True\", \"False\"]',1,NULL,0,0,'2026-03-31 20:26:47'),('9d0668e5-608b-4026-b18d-ceaf9c73ea83','eeeb9e09-4317-4822-bd77-0d06e054dcb6','383cd882-2c26-11f1-97b2-6c02e0d26821','multiple_choice','How do you import the math module?','[\"A) import math\", \"B) from math import *\", \"C) import math as m\", \"D) All of the above\"]',3,NULL,3,1,'2026-04-01 01:16:50'),('9fc14795-eabc-4416-b89c-1140ff47adb7','694d031f-8f64-44b7-8718-edc3b93c2d4b','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',1,NULL,0,0,'2026-03-30 14:01:31'),('a2021db1-fc17-4212-aa71-6581c5a085dc','1626a0fc-6314-4ce4-9196-1dfce94a5d55','ed771211-2c34-11f1-97b2-6c02e0d26821','true_false','The keyword elif means \"else if\".','[\"True\", \"False\"]',1,NULL,0,0,'2026-03-30 15:41:25'),('a5bbe37b-2036-47a5-a0d4-8a75340fac9a','ff7bc55c-ab03-4905-8aac-79c9b1771232','ed71610c-2c34-11f1-97b2-6c02e0d26821','true_false','Python uses indentation to define code blocks.','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-30 15:42:49'),('a66bad5f-7717-4ed6-a2c0-703be089a348','694d031f-8f64-44b7-8718-edc3b93c2d4b','e2f83c17-2c25-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',2,NULL,2,1,'2026-03-30 14:01:31'),('a6da967e-2ed6-46b0-89a5-308d6cd73b60','d8b82f5d-22a4-430c-9c52-3ad69a878787','ed5c8b6c-2c34-11f1-97b2-6c02e0d26821','true_false','Lists in Python are mutable.','[\"True\", \"False\"]',1,NULL,0,0,'2026-04-01 01:22:57'),('acd53acd-6829-4395-aa06-28701afebd02','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','383cd882-2c26-11f1-97b2-6c02e0d26821','multiple_choice','How do you import the math module?','[\"A) import math\", \"B) from math import *\", \"C) import math as m\", \"D) All of the above\"]',3,NULL,3,1,'2026-03-31 20:26:47'),('aeec0047-ce4b-4ab5-af95-cb4db3d283d0','694d031f-8f64-44b7-8718-edc3b93c2d4b','382eb868-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What does len({\"a\":1, \"b\":2, \"c\":3}) return?','[\"A) 1\", \"B) 2\", \"C) 3\", \"D) 0\"]',2,NULL,2,1,'2026-03-30 14:01:31'),('b229232a-a93c-4a23-83fa-871178dcfa48','694d031f-8f64-44b7-8718-edc3b93c2d4b','e3078f58-2c25-11f1-97b2-6c02e0d26821','multiple_choice','Which keyword is used to handle exceptions?','[\"A) try\", \"B) catch\", \"C) except\", \"D) Both A and C\"]',3,NULL,3,1,'2026-03-30 14:01:31'),('b298924f-6617-476f-b713-df57018c85c5','d8b82f5d-22a4-430c-9c52-3ad69a878787','8e543e86-2c34-11f1-97b2-6c02e0d26821','true_false','Python is a statically typed language.','[\"True\", \"False\"]',1,NULL,1,1,'2026-04-01 01:22:57'),('b2a4fc6e-c783-4ace-be7b-00fedf742f65','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','ed955742-2c34-11f1-97b2-6c02e0d26821','true_false','print() is used to display output in Python.','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-31 21:15:04'),('b6eb87da-518c-48d0-aaa1-b1f3f7e61e2f','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','e300e22b-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the correct way to write a function in Python?','[\"A) function my_func():\", \"B) def my_func():\", \"C) func my_func():\", \"D) declare my_func():\"]',1,NULL,1,1,'2026-03-31 21:15:04'),('b7f2cff1-220b-481b-be37-1ee29182610b','d8b82f5d-22a4-430c-9c52-3ad69a878787','e300e22b-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the correct way to write a function in Python?','[\"A) function my_func():\", \"B) def my_func():\", \"C) func my_func():\", \"D) declare my_func():\"]',3,NULL,1,0,'2026-04-01 01:22:57'),('b95c5d52-9190-4a64-8be9-e713bd470893','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','ed71610c-2c34-11f1-97b2-6c02e0d26821','true_false','Python uses indentation to define code blocks.','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-31 21:15:04'),('bacca4bf-42f5-4cf0-9bef-08981759b55b','d8b82f5d-22a4-430c-9c52-3ad69a878787','ed8d917d-2c34-11f1-97b2-6c02e0d26821','true_false','The expression 5 / 2 in Python returns 2.','[\"True\", \"False\"]',1,NULL,1,1,'2026-04-01 01:22:57'),('be22bc47-4067-47fa-a117-e0674c32601a','ff7bc55c-ab03-4905-8aac-79c9b1771232','8e543e86-2c34-11f1-97b2-6c02e0d26821','true_false','Python is a statically typed language.','[\"True\", \"False\"]',1,NULL,1,1,'2026-03-30 15:42:49'),('bf34ee0a-e983-4dc6-94bd-911d3adb2217','694d031f-8f64-44b7-8718-edc3b93c2d4b','38376d50-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of this snippet?\nprint(\"Hello\" + str(5))','[\"A) Hello\", \"B) Hello5\", \"C) Error\", \"D) 5Hello\"]',1,NULL,1,1,'2026-03-30 14:01:31'),('c7e1ddc2-c48e-4027-8172-06f0581a448e','eeeb9e09-4317-4822-bd77-0d06e054dcb6','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',0,NULL,0,1,'2026-04-01 01:16:50'),('ce1f9306-26fa-4363-bd86-a8a338ff0f3c','d8b82f5d-22a4-430c-9c52-3ad69a878787','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',3,NULL,0,0,'2026-04-01 01:22:57'),('ce899606-413c-428d-a697-52f0b3924da3','eeeb9e09-4317-4822-bd77-0d06e054dcb6','35d01991-2c24-11f1-97b2-6c02e0d26821','multiple_choice','Which of the following is a mutable data type in Python?','[\"A) tuple\", \"B) str\", \"C) list\", \"D) int\"]',2,NULL,2,1,'2026-04-01 01:16:50'),('ced1eae8-6227-45e5-ace5-4abdc5aa2143','eeeb9e09-4317-4822-bd77-0d06e054dcb6','ed771211-2c34-11f1-97b2-6c02e0d26821','true_false','The keyword elif means \"else if\".','[\"True\", \"False\"]',0,NULL,0,1,'2026-04-01 01:16:50'),('d8fda7c0-0f43-400d-bab4-a9208f8f2a3b','694d031f-8f64-44b7-8718-edc3b93c2d4b','e30d7a86-2c25-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following list comprehension?\n[i for i in range(5) if i % 2 == 0]','[\"A) [1, 3]\", \"B) [0, 1, 2, 3, 4]\", \"C) [0, 2, 4]\", \"D) [2, 4]\"]',2,NULL,2,1,'2026-03-30 14:01:31'),('db99ee07-1602-48b4-b58d-f2a712418909','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',0,NULL,0,1,'2026-03-31 20:26:47'),('dd22037f-f746-4bca-b7f1-ef726dcce4db','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','ed8d917d-2c34-11f1-97b2-6c02e0d26821','true_false','The expression 5 / 2 in Python returns 2.','[\"True\", \"False\"]',0,NULL,1,0,'2026-03-31 20:26:47'),('de88cacd-e930-47de-9ac8-d4ead97d2507','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','38376d50-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of this snippet?\nprint(\"Hello\" + str(5))','[\"A) Hello\", \"B) Hello5\", \"C) Error\", \"D) 5Hello\"]',1,NULL,1,1,'2026-03-31 21:15:04'),('dfa04dcc-a7c6-4cec-8947-721eea657865','79ad8dff-7d59-4aa9-9c91-3438b360d5dc','ed771211-2c34-11f1-97b2-6c02e0d26821','true_false','The keyword elif means \"else if\".','[\"True\", \"False\"]',0,NULL,0,1,'2026-03-31 21:15:04'),('e23213db-d2ad-40cb-bd5a-ef8ef227db19','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','38376d50-2c26-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of this snippet?\nprint(\"Hello\" + str(5))','[\"A) Hello\", \"B) Hello5\", \"C) Error\", \"D) 5Hello\"]',1,NULL,1,1,'2026-04-01 01:23:35'),('e3ad463b-181c-4443-ac67-821ac95589ec','eeeb9e09-4317-4822-bd77-0d06e054dcb6','ed800e11-2c34-11f1-97b2-6c02e0d26821','true_false','You must declare variable types before using them in Python.','[\"True\", \"False\"]',0,NULL,1,0,'2026-04-01 01:16:50'),('e71e16a2-48d0-40b9-8412-07684607eff2','eeeb9e09-4317-4822-bd77-0d06e054dcb6','e2f83c17-2c25-11f1-97b2-6c02e0d26821','multiple_choice','4) What is printed by this code?\nx = 10\ndef func():\n    x = 5\n    print(x)\nfunc()\nprint(x)','[\"A) 5 and 5\", \"B) 10 and 10\", \"C) 5 and 10\", \"D) Error\"]',2,NULL,2,1,'2026-04-01 01:16:50'),('e83c35a5-0f32-4416-855d-e78cbd8cdbfb','1626a0fc-6314-4ce4-9196-1dfce94a5d55','e3078f58-2c25-11f1-97b2-6c02e0d26821','multiple_choice','Which keyword is used to handle exceptions?','[\"A) try\", \"B) catch\", \"C) except\", \"D) Both A and C\"]',1,NULL,3,0,'2026-03-30 15:41:25'),('e93fc152-f579-4c15-9b3d-af371a9a944c','d1b3e5bf-6201-402f-b5b4-aa7a426c3c74','ed800e11-2c34-11f1-97b2-6c02e0d26821','true_false','You must declare variable types before using them in Python.','[\"True\", \"False\"]',1,NULL,1,1,'2026-03-31 20:26:47'),('eac3e527-b972-4de6-8339-013128c02c3e','1626a0fc-6314-4ce4-9196-1dfce94a5d55','ed71610c-2c34-11f1-97b2-6c02e0d26821','true_false','Python uses indentation to define code blocks.','[\"True\", \"False\"]',1,NULL,0,0,'2026-03-30 15:41:25'),('eb6a046e-21c2-4bf8-8987-c52c9e5eaf2a','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','ed6a6550-2c34-11f1-97b2-6c02e0d26821','true_false','The len() function can be used on strings, lists, and dictionaries.','[\"True\", \"False\"]',0,NULL,0,1,'2026-04-01 01:23:35'),('ed3711db-2ccd-49a3-9622-411e3297d4ef','1626a0fc-6314-4ce4-9196-1dfce94a5d55','ed62e27f-2c34-11f1-97b2-6c02e0d26821','true_false','A tuple can be modified after it is created.','[\"True\", \"False\"]',0,NULL,1,0,'2026-03-30 15:41:25'),('f1885fe6-72bb-4b71-9191-13cc67218244','ff7bc55c-ab03-4905-8aac-79c9b1771232','35d9af7f-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What does the len() function do?','[\"A) Returns the number of characters in a string\", \"B) Returns the number of items in a sequence\", \"C) Returns the length of a list, tuple, dict, or string\", \"D) All of the above\"]',3,NULL,3,1,'2026-03-30 15:42:49'),('f1908b44-9756-42f1-93a6-46b97d4ef0c4','694d031f-8f64-44b7-8718-edc3b93c2d4b','383cd882-2c26-11f1-97b2-6c02e0d26821','multiple_choice','How do you import the math module?','[\"A) import math\", \"B) from math import *\", \"C) import math as m\", \"D) All of the above\"]',3,NULL,3,1,'2026-03-30 14:01:31'),('f336c8ef-75dc-4fec-b510-9aa638e51eef','ff7bc55c-ab03-4905-8aac-79c9b1771232','ed86ac2d-2c34-11f1-97b2-6c02e0d26821','true_false','Dictionaries store data in key-value pairs.','[\"True\", \"False\"]',1,NULL,0,0,'2026-03-30 15:42:49'),('f3766b53-868f-44af-85da-18f21942a0b7','eeeb9e09-4317-4822-bd77-0d06e054dcb6','8e543e86-2c34-11f1-97b2-6c02e0d26821','true_false','Python is a statically typed language.','[\"True\", \"False\"]',0,NULL,1,0,'2026-04-01 01:16:50'),('f8e6311e-9caf-4cbc-8a7a-b6c285acad84','ff7bc55c-ab03-4905-8aac-79c9b1771232','e3078f58-2c25-11f1-97b2-6c02e0d26821','multiple_choice','Which keyword is used to handle exceptions?','[\"A) try\", \"B) catch\", \"C) except\", \"D) Both A and C\"]',3,NULL,3,1,'2026-03-30 15:42:49'),('fadc78bd-8d70-45f7-8288-1c8de784c687','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','35c39823-2c24-11f1-97b2-6c02e0d26821','multiple_choice','What is the output of the following code?    print(type( (5,) ))','[\"A) <class \'tuple\'>\", \"B) <class \'list\'>\", \"C) <class \'int\'>\", \"D) <class \'dict\'>\"]',0,NULL,0,1,'2026-04-01 01:23:35'),('fe864c17-e036-4af7-afb1-a514b876d24e','946a3cdd-0581-44a3-b7d1-f84d3479e0a6','ed955742-2c34-11f1-97b2-6c02e0d26821','true_false','print() is used to display output in Python.','[\"True\", \"False\"]',0,NULL,0,1,'2026-04-01 01:23:35');
/*!40000 ALTER TABLE `course_quiz_attempt_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollment`
--

DROP TABLE IF EXISTS `enrollment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrolledAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('enrolled','in_progress','completed','dropped') COLLATE utf8mb4_unicode_ci DEFAULT 'enrolled',
  `progressPercentage` decimal(5,2) DEFAULT '0.00',
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`studentId`,`courseId`),
  KEY `courseId` (`courseId`),
  CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollment`
--

LOCK TABLES `enrollment` WRITE;
/*!40000 ALTER TABLE `enrollment` DISABLE KEYS */;
INSERT INTO `enrollment` VALUES ('0f0ee3bf-2d48-11f1-97b2-6c02e0d26821','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 00:24:53','completed',100.00,'2026-04-01 01:12:28'),('1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 21:08:24','completed',100.00,'2026-03-30 13:58:45'),('40298899-2ab4-11f1-97b2-6c02e0d26821','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 17:41:48','completed',100.00,'2026-03-28 17:42:24'),('5a40313e-2a8e-11f1-97b2-6c02e0d26821','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 13:10:31','completed',100.00,'2026-03-28 13:28:50'),('5d2f1c3e-2d42-11f1-97b2-6c02e0d26821','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 23:44:07','enrolled',0.00,NULL),('69855d7a-2d2d-11f1-97b2-6c02e0d26821','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-31 21:14:09','completed',100.00,'2026-03-31 21:14:27'),('69dc343f-20d1-11f1-97b2-6c02e0d26821','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-16 02:45:22','completed',100.00,NULL),('6d69724c-2842-11f1-97b2-6c02e0d26821','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-25 14:01:59','completed',100.00,'2026-03-27 18:40:19'),('8401c02b-2a91-11f1-97b2-6c02e0d26821','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 13:33:09','completed',100.00,'2026-03-28 13:33:33'),('9df9d40e-2ad0-11f1-97b2-6c02e0d26821','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 21:04:51','completed',100.00,'2026-03-30 13:53:48'),('9fb4925b-2c35-11f1-97b2-6c02e0d26821','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-30 15:40:24','completed',100.00,'2026-03-30 15:40:44'),('e2010964-2ab4-11f1-97b2-6c02e0d26821','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-28 17:46:19','completed',100.00,'2026-03-28 17:46:46'),('e3ba91db-2841-11f1-97b2-6c02e0d26821','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-03-25 13:58:08','completed',100.00,'2026-03-31 20:26:08'),('f1ce0abc-2d4f-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-01 01:21:20','completed',100.00,'2026-04-01 01:22:29');
/*!40000 ALTER TABLE `enrollment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollment_payment`
--

DROP TABLE IF EXISTS `enrollment_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment_payment` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrollmentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cardLast4` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypalEmail` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypalTxnId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` enum('card','paypal','wallet','cash') COLLATE utf8mb4_unicode_ci DEFAULT 'card',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment_payment` (`enrollmentId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_courseId` (`courseId`),
  KEY `idx_method` (`method`),
  CONSTRAINT `enrollment_payment_ibfk_1` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollment_payment_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollment_payment_ibfk_3` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollment_payment`
--

LOCK TABLES `enrollment_payment` WRITE;
/*!40000 ALTER TABLE `enrollment_payment` DISABLE KEYS */;
INSERT INTO `enrollment_payment` VALUES ('0f1852f7-2d48-11f1-97b2-6c02e0d26821','0f0ee3bf-2d48-11f1-97b2-6c02e0d26821','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','nasser','nasser@gmail.com','Palestine','6876',NULL,NULL,'card','2026-04-01 00:24:53'),('1cdd5bad-2ad1-11f1-97b2-6c02e0d26821','1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','ola','ola@gmail.com','Bahamas','5678',NULL,NULL,'card','2026-03-28 21:08:24'),('5d344963-2d42-11f1-97b2-6c02e0d26821','5d2f1c3e-2d42-11f1-97b2-6c02e0d26821','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','╪د┘╪د╪ة ┘╪د╪╡╪▒ ╪ص╪│┘è┘ ╪»┘è╪▒┘è','s12216968@stu.najah.edu',NULL,NULL,NULL,NULL,'wallet','2026-03-31 23:44:08'),('698aeeba-2d2d-11f1-97b2-6c02e0d26821','69855d7a-2d2d-11f1-97b2-6c02e0d26821','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','talia','talia@gmail.com',NULL,NULL,NULL,NULL,'wallet','2026-03-31 21:14:09'),('9fcbfb25-2c35-11f1-97b2-6c02e0d26821','9fb4925b-2c35-11f1-97b2-6c02e0d26821','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','jihad','jihad@gmail.com',NULL,NULL,NULL,NULL,'wallet','2026-03-30 15:40:25'),('f1d38941-2d4f-11f1-97b2-6c02e0d26821','f1ce0abc-2d4f-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','toto','toto@gmail.com','Palestine','8572',NULL,NULL,'card','2026-04-01 01:21:20');
/*!40000 ALTER TABLE `enrollment_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finance_transaction`
--

DROP TABLE IF EXISTS `finance_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finance_transaction` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `transactionDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `type` enum('enrollment','refund','payout') COLLATE utf8mb4_unicode_ci DEFAULT 'enrollment',
  `status` enum('success','failed','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherShare` decimal(10,2) DEFAULT '0.00',
  `platformShare` decimal(10,2) DEFAULT '0.00',
  `method` enum('wallet','card','cash') COLLATE utf8mb4_unicode_ci DEFAULT 'card',
  `notes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactionDate` (`transactionDate`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_teacherId` (`teacherId`),
  KEY `idx_courseId` (`courseId`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  CONSTRAINT `finance_transaction_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `finance_transaction_ibfk_2` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `finance_transaction_ibfk_3` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finance_transaction`
--

LOCK TABLES `finance_transaction` WRITE;
/*!40000 ALTER TABLE `finance_transaction` DISABLE KEYS */;
INSERT INTO `finance_transaction` VALUES ('0f15b8a2-2d48-11f1-97b2-6c02e0d26821','2026-04-01 00:24:53','enrollment','success',20.00,'USD','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'card','Enrollment payment','2026-04-01 00:24:53'),('1cdb0a73-2ad1-11f1-97b2-6c02e0d26821','2026-03-28 21:08:24','enrollment','success',20.00,'USD','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'card','Enrollment payment','2026-03-28 21:08:24'),('5d31d54a-2d42-11f1-97b2-6c02e0d26821','2026-03-31 23:44:07','enrollment','success',20.00,'USD','33fe4baa-2d42-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'wallet','Enrollment payment','2026-03-31 23:44:07'),('698856c1-2d2d-11f1-97b2-6c02e0d26821','2026-03-31 21:14:09','enrollment','success',20.00,'USD','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'wallet','Enrollment payment','2026-03-31 21:14:09'),('9e00ff68-2ad0-11f1-97b2-6c02e0d26821','2026-03-28 21:04:51','enrollment','success',20.00,'USD','f74bdb60-2acf-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'card','Enrollment payment','2026-03-28 21:04:51'),('9fb91d27-2c35-11f1-97b2-6c02e0d26821','2026-03-30 15:40:24','enrollment','success',20.00,'USD','820b3b3c-2c26-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'wallet','Enrollment payment','2026-03-30 15:40:24'),('f1d05c2b-2d4f-11f1-97b2-6c02e0d26821','2026-04-01 01:21:20','enrollment','success',20.00,'USD','e0183a49-2d4f-11f1-97b2-6c02e0d26821','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821',12.00,8.00,'card','Enrollment payment','2026-04-01 01:21:20');
/*!40000 ALTER TABLE `finance_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lesson`
--

DROP TABLE IF EXISTS `lesson`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moduleId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('text','code_example','live_python','video_embed','quiz','mixed') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `enableLiveEditor` tinyint(1) NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'lesson content in Markdown + code blocks',
  `videoUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderNumber` int NOT NULL,
  `durationMinutes` int DEFAULT '0',
  `isPublished` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `codeContent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `liveEditorLanguage` enum('python','javascript','html_css') COLLATE utf8mb4_unicode_ci DEFAULT 'python',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lesson_order` (`moduleId`,`orderNumber`),
  CONSTRAINT `lesson_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lesson`
--

LOCK TABLES `lesson` WRITE;
/*!40000 ALTER TABLE `lesson` DISABLE KEYS */;
INSERT INTO `lesson` VALUES ('812b4936-207f-11f1-97b2-6c02e0d26821','7c0ea9ec-2079-11f1-97b2-6c02e0d26821','Installing Python','mixed',0,NULL,'To start programming with Python, you need to install it on your computer.\n\n### Steps:\n\n1.Download Python from the official website\nhttps://www.python.org/downloads/\n\n2.Install Python.\n\n3.Ensure \"Add Python to PATH\" is checked during installation.\n\n### Verify Installation\nOpen the terminal and type:\n```python --version```\nIf Python is installed correctly, it will show the version number.\n\n',NULL,2,10,1,'2026-03-15 16:59:02','2026-03-15 23:03:16',NULL,'python'),('eeb08b04-20b0-11f1-97b2-6c02e0d26821','603620ee-20b0-11f1-97b2-6c02e0d26821','Variables and Data Types','text',1,NULL,'Variables store data values.\n### Example\nname = \"Lane\"\nage = 22\nheight = 1.65\n\n### Common Data Types:\nType     	     Example\nInteger	          10\nFloat	           3.14\nString	          \"Hello\"\nBoolean      	 True / False\n\n### Practice:\nCreate variables for this and print the result:\nname is Mika\nage is 27\nfavorite color gray\n{{starter:\nprint(f\"My name is {name}, I am {age} years old, and my favorite color is {favorite_color}.\")}}\n\n{{answer:\nMy name is Mika, I am 27 years old, and my favorite color is gray.\n}}',NULL,1,10,1,'2026-03-15 22:52:51','2026-04-01 01:06:21',NULL,'python'),('f49dab1e-207c-11f1-97b2-6c02e0d26821','7c0ea9ec-2079-11f1-97b2-6c02e0d26821','What is Python?','mixed',1,NULL,'Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used in many fields such as:\n\nWeb development\nData science\nArtificial intelligence\nAutomation\nSoftware development\n\nPython was designed to make programming easier to learn and faster to develop.\n\n## Example:\n\nA simple Python program:\n```print(\"Hello, World!\")```\nWrite a Python program that prints : \"Welcome to the Python course!\"\n{{starter:\nprint(\"\")\n}}\n{{answer:\nWelcome to the Python course!\n}}\n{{video:https://youtu.be/vE7Cy5csYbQ}}\n\n\n',NULL,1,5,1,'2026-03-15 16:40:47','2026-04-01 00:56:57',NULL,'python');
/*!40000 ALTER TABLE `lesson` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessonprogress`
--

DROP TABLE IF EXISTS `lessonprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessonprogress` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrollmentId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lessonId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `progressPercentage` decimal(5,2) DEFAULT '0.00',
  `startedAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`enrollmentId`,`lessonId`),
  KEY `lessonId` (`lessonId`),
  CONSTRAINT `lessonprogress_ibfk_1` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lessonprogress_ibfk_2` FOREIGN KEY (`lessonId`) REFERENCES `lesson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessonprogress`
--

LOCK TABLES `lessonprogress` WRITE;
/*!40000 ALTER TABLE `lessonprogress` DISABLE KEYS */;
INSERT INTO `lessonprogress` VALUES ('013f0b4a-2d50-11f1-97b2-6c02e0d26821','f1ce0abc-2d4f-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-04-01 01:21:46','2026-04-01 01:22:29'),('0fdaad58-2d48-11f1-97b2-6c02e0d26821','0f0ee3bf-2d48-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-04-01 00:57:53','2026-04-01 00:57:34'),('118fdf3f-2bb0-11f1-97b2-6c02e0d26821','9df9d40e-2ad0-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 13:57:23','2026-03-30 13:53:48'),('20432268-29fa-11f1-97b2-6c02e0d26821','6d69724c-2842-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-27 18:29:28','2026-03-27 18:29:28'),('46597ffd-2ab4-11f1-97b2-6c02e0d26821','40298899-2ab4-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:42:25','2026-03-28 17:42:09'),('4da7057d-2ab4-11f1-97b2-6c02e0d26821','40298899-2ab4-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:42:16','2026-03-28 17:42:13'),('55293177-2ab4-11f1-97b2-6c02e0d26821','40298899-2ab4-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:42:23','2026-03-28 17:42:24'),('5d9672eb-2d42-11f1-97b2-6c02e0d26821','5d2f1c3e-2d42-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',0,0.00,'2026-03-31 23:44:08',NULL),('63336b1b-2c27-11f1-97b2-6c02e0d26821','1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 14:02:08','2026-03-30 13:58:37'),('684c1ac6-2c27-11f1-97b2-6c02e0d26821','1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 13:58:42','2026-03-30 13:58:40'),('6b3780f7-2c27-11f1-97b2-6c02e0d26821','1cd77fb6-2ad1-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 13:58:43','2026-03-30 13:58:45'),('6b511666-2d2d-11f1-97b2-6c02e0d26821','69855d7a-2d2d-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-31 23:28:13','2026-03-31 21:14:17'),('6f4382d4-2d2d-11f1-97b2-6c02e0d26821','69855d7a-2d2d-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-31 23:28:21','2026-03-31 21:14:21'),('6f93e822-2baf-11f1-97b2-6c02e0d26821','9df9d40e-2ad0-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 01:19:28','2026-03-30 01:01:09'),('73856bce-2d2d-11f1-97b2-6c02e0d26821','69855d7a-2d2d-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-31 21:14:26','2026-03-31 21:14:27'),('81cb3ce9-20d1-11f1-97b2-6c02e0d26821','69dc343f-20d1-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:46:02','2026-03-16 02:46:02'),('88824701-2a91-11f1-97b2-6c02e0d26821','8401c02b-2a91-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:33:33','2026-03-28 13:33:21'),('8907cbdb-20d1-11f1-97b2-6c02e0d26821','69dc343f-20d1-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:46:14','2026-03-16 02:46:14'),('8b983012-2a91-11f1-97b2-6c02e0d26821','8401c02b-2a91-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:33:26','2026-03-28 13:33:23'),('904ba642-20d1-11f1-97b2-6c02e0d26821','69dc343f-20d1-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-16 02:46:26','2026-03-16 02:46:26'),('90c3d3cd-2a91-11f1-97b2-6c02e0d26821','8401c02b-2a91-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:33:31','2026-03-28 13:33:33'),('922f08a2-2a8e-11f1-97b2-6c02e0d26821','5a40313e-2a8e-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:31:51','2026-03-28 13:12:43'),('9f005299-29fb-11f1-97b2-6c02e0d26821','6d69724c-2842-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-27 18:40:10','2026-03-27 18:40:10'),('a23ee063-2c35-11f1-97b2-6c02e0d26821','9fb4925b-2c35-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 15:42:15','2026-03-30 15:40:35'),('a4605c01-29fb-11f1-97b2-6c02e0d26821','6d69724c-2842-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-27 18:40:19','2026-03-27 18:40:19'),('a46695c9-2d4c-11f1-97b2-6c02e0d26821','0f0ee3bf-2d48-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-04-01 00:57:56','2026-04-01 00:57:52'),('a64a243b-2d26-11f1-97b2-6c02e0d26821','e3ba91db-2841-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-31 20:26:08','2026-03-31 20:25:56'),('a6c3652d-2c35-11f1-97b2-6c02e0d26821','9fb4925b-2c35-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 15:40:41','2026-03-30 15:40:39'),('aa86689b-2c35-11f1-97b2-6c02e0d26821','9fb4925b-2c35-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 15:40:43','2026-03-30 15:40:44'),('adf2796c-2d4c-11f1-97b2-6c02e0d26821','0f0ee3bf-2d48-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-04-01 01:06:44','2026-04-01 01:12:28'),('ae8576f8-2d26-11f1-97b2-6c02e0d26821','e3ba91db-2841-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-31 20:26:05','2026-03-31 20:26:00'),('b1dae79e-2d26-11f1-97b2-6c02e0d26821','e3ba91db-2841-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-31 20:26:07','2026-03-31 20:26:08'),('b3310b8a-2a8e-11f1-97b2-6c02e0d26821','5a40313e-2a8e-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:31:53','2026-03-28 13:13:17'),('c2dbb7a5-2a8e-11f1-97b2-6c02e0d26821','5a40313e-2a8e-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 13:31:55','2026-03-28 13:28:50'),('cd9b9794-2bba-11f1-97b2-6c02e0d26821','9df9d40e-2ad0-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-30 01:19:37','2026-03-30 01:05:23'),('e4bfa341-2ab4-11f1-97b2-6c02e0d26821','e2010964-2ab4-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:46:46','2026-03-28 17:46:33'),('eb2a64f0-2ab4-11f1-97b2-6c02e0d26821','e2010964-2ab4-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:46:40','2026-03-28 17:46:37'),('f0ef50ca-2ab4-11f1-97b2-6c02e0d26821','e2010964-2ab4-11f1-97b2-6c02e0d26821','eeb08b04-20b0-11f1-97b2-6c02e0d26821',1,100.00,'2026-03-28 17:46:44','2026-03-28 17:46:46'),('f285317c-2d4f-11f1-97b2-6c02e0d26821','f1ce0abc-2d4f-11f1-97b2-6c02e0d26821','f49dab1e-207c-11f1-97b2-6c02e0d26821',1,100.00,'2026-04-01 01:22:29','2026-04-01 01:21:38'),('fcf9e618-2d4f-11f1-97b2-6c02e0d26821','f1ce0abc-2d4f-11f1-97b2-6c02e0d26821','812b4936-207f-11f1-97b2-6c02e0d26821',1,100.00,'2026-04-01 01:21:44','2026-04-01 01:21:42');
/*!40000 ALTER TABLE `lessonprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_session`
--

DROP TABLE IF EXISTS `live_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_session` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `startAt` datetime NOT NULL,
  `endAt` datetime NOT NULL,
  `meetingLink` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('scheduled','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_live_teacher` (`teacherId`),
  KEY `idx_live_course` (`courseId`),
  KEY `idx_live_start` (`startAt`),
  CONSTRAINT `live_session_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `live_session_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_session`
--

LOCK TABLES `live_session` WRITE;
/*!40000 ALTER TABLE `live_session` DISABLE KEYS */;
INSERT INTO `live_session` VALUES ('08b4b592-93ee-494c-bded-6bb90df9a2f9','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Q&A','important to join','2026-04-22 15:00:00','2026-04-22 15:30:00','https://us05web.zoom.us/j/85843998071?pwd=VtIapuaVWXLQqHqs3ClqddVezi8Q6e.1','scheduled','2026-03-31 23:33:05','2026-03-31 23:33:05'),('41f90f30-2865-4c28-9e7e-c6a44d260fc0','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Q&A','important to join','2026-04-01 15:00:00','2026-04-01 15:30:00','https://us05web.zoom.us/j/85843998071?pwd=VtIapuaVWXLQqHqs3ClqddVezi8Q6e.1','scheduled','2026-03-31 23:33:05','2026-03-31 23:33:05'),('cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Q&A','important to join','2026-04-15 15:00:00','2026-04-15 15:30:00','https://us05web.zoom.us/j/85843998071?pwd=VtIapuaVWXLQqHqs3ClqddVezi8Q6e.1','scheduled','2026-03-31 23:33:05','2026-03-31 23:33:05'),('de0019dd-422d-4846-8712-9b4c2e9f748a','f1779632-1905-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Q&A','important to join','2026-04-08 15:00:00','2026-04-08 15:30:00','https://us05web.zoom.us/j/85843998071?pwd=VtIapuaVWXLQqHqs3ClqddVezi8Q6e.1','scheduled','2026-03-31 23:33:05','2026-03-31 23:33:05');
/*!40000 ALTER TABLE `live_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_session_attendance`
--

DROP TABLE IF EXISTS `live_session_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_session_attendance` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sessionId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attended` tinyint(1) DEFAULT '0',
  `markedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session_student` (`sessionId`,`studentId`),
  KEY `idx_att_session` (`sessionId`),
  KEY `idx_att_student` (`studentId`),
  CONSTRAINT `live_session_attendance_ibfk_1` FOREIGN KEY (`sessionId`) REFERENCES `live_session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `live_session_attendance_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_session_attendance`
--

LOCK TABLES `live_session_attendance` WRITE;
/*!40000 ALTER TABLE `live_session_attendance` DISABLE KEYS */;
INSERT INTO `live_session_attendance` VALUES ('021451dd-bf13-49b5-8a07-e21772ee963a','41f90f30-2865-4c28-9e7e-c6a44d260fc0','ceb02830-1a95-11f1-97b2-6c02e0d26821',0,NULL),('0bf0ff04-16d8-4159-abae-3ab94f696fde','41f90f30-2865-4c28-9e7e-c6a44d260fc0','955acab2-18fd-11f1-97b2-6c02e0d26821',0,NULL),('0c984f0c-dee8-4073-a6dc-176edab103bb','08b4b592-93ee-494c-bded-6bb90df9a2f9','f74bdb60-2acf-11f1-97b2-6c02e0d26821',0,NULL),('0d73ca14-723d-47f8-a6cd-50fdd2ecb982','de0019dd-422d-4846-8712-9b4c2e9f748a','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821',0,NULL),('122225da-359b-4e44-838b-cc161337e7f3','08b4b592-93ee-494c-bded-6bb90df9a2f9','820b3b3c-2c26-11f1-97b2-6c02e0d26821',0,NULL),('1eb4b6cb-1e83-41b3-84ac-b263b44bb54d','41f90f30-2865-4c28-9e7e-c6a44d260fc0','437c1b23-1bab-11f1-97b2-6c02e0d26821',0,NULL),('223d74a6-cf05-49ff-b62e-18a51b7a5049','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','437c1b23-1bab-11f1-97b2-6c02e0d26821',0,NULL),('24e3e7cf-df93-47fa-9d84-6134d624ff7d','08b4b592-93ee-494c-bded-6bb90df9a2f9','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821',0,NULL),('284bb2e4-5701-446f-b199-1d805192daa0','41f90f30-2865-4c28-9e7e-c6a44d260fc0','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',0,NULL),('297e927f-8904-4530-b8e3-bd5b61194714','08b4b592-93ee-494c-bded-6bb90df9a2f9','3def91a4-1bac-11f1-97b2-6c02e0d26821',0,NULL),('3b9d662d-e563-4431-8c97-788893672356','de0019dd-422d-4846-8712-9b4c2e9f748a','ceb02830-1a95-11f1-97b2-6c02e0d26821',0,NULL),('4ee729b6-540f-4164-b216-49471eb970e3','de0019dd-422d-4846-8712-9b4c2e9f748a','820b3b3c-2c26-11f1-97b2-6c02e0d26821',0,NULL),('5489800b-73b9-4d6b-ac2e-4fbf3e14f57a','08b4b592-93ee-494c-bded-6bb90df9a2f9','ceb02830-1a95-11f1-97b2-6c02e0d26821',0,NULL),('57a602ea-623b-4b77-935c-c1bc3092837e','de0019dd-422d-4846-8712-9b4c2e9f748a','57967169-2842-11f1-97b2-6c02e0d26821',0,NULL),('6b9c770d-3cd5-4297-bad9-96f88f699c47','41f90f30-2865-4c28-9e7e-c6a44d260fc0','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821',0,NULL),('760a40cf-bfda-4c5a-a54c-85072623e666','41f90f30-2865-4c28-9e7e-c6a44d260fc0','820b3b3c-2c26-11f1-97b2-6c02e0d26821',0,NULL),('77a450a1-7887-4e04-a010-08426fad63e2','de0019dd-422d-4846-8712-9b4c2e9f748a','598cdd8a-2d2d-11f1-97b2-6c02e0d26821',0,NULL),('78c2ef2a-0a39-473b-934f-f77929efce07','41f90f30-2865-4c28-9e7e-c6a44d260fc0','f74bdb60-2acf-11f1-97b2-6c02e0d26821',0,NULL),('7f5a5ca9-b897-4b69-a4dc-14347a62bc58','de0019dd-422d-4846-8712-9b4c2e9f748a','437c1b23-1bab-11f1-97b2-6c02e0d26821',0,NULL),('8277329b-119e-44af-8745-a49bee707264','41f90f30-2865-4c28-9e7e-c6a44d260fc0','3def91a4-1bac-11f1-97b2-6c02e0d26821',0,NULL),('88cc6274-3c5e-4d49-ac78-fc6070b544d4','08b4b592-93ee-494c-bded-6bb90df9a2f9','598cdd8a-2d2d-11f1-97b2-6c02e0d26821',0,NULL),('8b343480-6d5f-434d-b331-a6baec2019ec','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','ceb02830-1a95-11f1-97b2-6c02e0d26821',0,NULL),('8db01253-c59f-4cef-9eec-4404fb5cee61','08b4b592-93ee-494c-bded-6bb90df9a2f9','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',0,NULL),('98621aeb-22bd-4a35-86a9-f627422e146f','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',0,NULL),('9c2fd318-a3bb-45c1-b13e-9534482c2c46','de0019dd-422d-4846-8712-9b4c2e9f748a','b6c714e4-1bab-11f1-97b2-6c02e0d26821',0,NULL),('9ee7d806-1292-468c-b37f-92ffe73b29d7','de0019dd-422d-4846-8712-9b4c2e9f748a','f74bdb60-2acf-11f1-97b2-6c02e0d26821',0,NULL),('a708a04d-94d4-4aff-b1d0-fed4cd7b8a2d','de0019dd-422d-4846-8712-9b4c2e9f748a','3def91a4-1bac-11f1-97b2-6c02e0d26821',0,NULL),('b331ddd1-26fd-45e2-a356-c5c80e7342a0','de0019dd-422d-4846-8712-9b4c2e9f748a','955acab2-18fd-11f1-97b2-6c02e0d26821',0,NULL),('bf0036b9-5f7d-46b4-a684-c854ae23c331','08b4b592-93ee-494c-bded-6bb90df9a2f9','b6c714e4-1bab-11f1-97b2-6c02e0d26821',0,NULL),('c47986a4-74eb-47c4-829a-fe7413209efa','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','b6c714e4-1bab-11f1-97b2-6c02e0d26821',0,NULL),('c7230c98-6b55-4bfc-9b96-b630a684f71c','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','598cdd8a-2d2d-11f1-97b2-6c02e0d26821',0,NULL),('c880fcda-be8a-4348-8755-ab082a1b5ef7','41f90f30-2865-4c28-9e7e-c6a44d260fc0','b6c714e4-1bab-11f1-97b2-6c02e0d26821',0,NULL),('cdaab03c-7f2d-4a91-822c-4211e28c6554','08b4b592-93ee-494c-bded-6bb90df9a2f9','57967169-2842-11f1-97b2-6c02e0d26821',0,NULL),('ce8f7975-e944-4827-ace8-011a86692228','08b4b592-93ee-494c-bded-6bb90df9a2f9','955acab2-18fd-11f1-97b2-6c02e0d26821',0,NULL),('db56ec5a-ed00-4379-9877-61158c15248a','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821',0,NULL),('df8c5bfd-b7a5-4dd0-9d89-e928538bb823','41f90f30-2865-4c28-9e7e-c6a44d260fc0','598cdd8a-2d2d-11f1-97b2-6c02e0d26821',0,NULL),('e8799e78-c05c-434f-a852-a31345a3e3fe','08b4b592-93ee-494c-bded-6bb90df9a2f9','437c1b23-1bab-11f1-97b2-6c02e0d26821',0,NULL),('e8ec0b61-5ca9-4b96-8798-12cc5487a82e','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','820b3b3c-2c26-11f1-97b2-6c02e0d26821',0,NULL),('ea607f47-18de-49f7-8477-b0744750dafa','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','955acab2-18fd-11f1-97b2-6c02e0d26821',0,NULL),('ecf8c557-5c87-4d21-a639-56e2752dafcb','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','f74bdb60-2acf-11f1-97b2-6c02e0d26821',0,NULL),('f5c0a52a-6698-4a4a-80b8-6689766587e3','de0019dd-422d-4846-8712-9b4c2e9f748a','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821',0,NULL),('fa23d822-a8d0-46e0-ad4f-75644811f166','41f90f30-2865-4c28-9e7e-c6a44d260fc0','57967169-2842-11f1-97b2-6c02e0d26821',0,NULL),('fab92116-194e-4b10-ae88-e1464ccf27c4','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','3def91a4-1bac-11f1-97b2-6c02e0d26821',0,NULL),('fbd3d469-88c0-4fb4-a8e5-06af5b86e024','cdde6391-ae5b-48bd-b42f-cf4ba22cc03f','57967169-2842-11f1-97b2-6c02e0d26821',0,NULL);
/*!40000 ALTER TABLE `live_session_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `orderNumber` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order` (`courseId`,`orderNumber`),
  CONSTRAINT `module_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
INSERT INTO `module` VALUES ('603620ee-20b0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Python Basics','-Python Syntax and Indentation\n-Variables and Data Types\n-Numbers and Mathematical Operations\n-Strings and String Manipulation\n-Comments and Code Readability\n-Input and Output in Python',2,'2026-03-15 22:48:52','2026-03-15 22:48:52'),('7c0ea9ec-2079-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Introduction to Python','-What is Python?\n-History and Features of Python\n-Installing Python and Setting Up the Environment\n-Writing Your First Python Program\n-Understanding the Python Interpreter\n-Python IDEs (VS Code, PyCharm, Jupyter)',1,'2026-03-15 16:15:56','2026-03-15 21:55:53'),('a2e67e29-2840-11f1-97b2-6c02e0d26821','8398c88d-2840-11f1-97b2-6c02e0d26821','chapter 1',NULL,1,'2026-03-25 13:49:10','2026-03-25 13:49:10');
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passwordresettoken`
--

DROP TABLE IF EXISTS `passwordresettoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passwordresettoken` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `userId` (`userId`),
  CONSTRAINT `passwordresettoken_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordresettoken`
--

LOCK TABLES `passwordresettoken` WRITE;
/*!40000 ALTER TABLE `passwordresettoken` DISABLE KEYS */;
INSERT INTO `passwordresettoken` VALUES ('0a8f4f0a-19bc-11f1-97b2-6c02e0d26821','ba9e888a-18fc-11f1-97b2-6c02e0d26821','6a7fa43c3fabcfb5f124715628d126aacfeec302a273f26829fc7ed9b1d82736','2026-03-07 03:24:45','2026-03-07 02:24:44');
/*!40000 ALTER TABLE `passwordresettoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES ('3ea888ae-18fa-11f1-97b2-6c02e0d26821','admin'),('3ea8c854-18fa-11f1-97b2-6c02e0d26821','student'),('3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','teacher');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_live_miss`
--

DROP TABLE IF EXISTS `student_live_miss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_live_miss` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `missedCount` int DEFAULT '0',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_course` (`studentId`,`courseId`),
  KEY `idx_miss_student` (`studentId`),
  KEY `idx_miss_course` (`courseId`),
  CONSTRAINT `student_live_miss_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_live_miss_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_live_miss`
--

LOCK TABLES `student_live_miss` WRITE;
/*!40000 ALTER TABLE `student_live_miss` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_live_miss` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_notification`
--

DROP TABLE IF EXISTS `student_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_notification` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('live_session','missed_session','course_failed','quiz_passed','quiz_failed','certificate_earned') COLLATE utf8mb4_unicode_ci DEFAULT 'live_session',
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student_notif_student` (`studentId`),
  KEY `idx_student_notif_course` (`courseId`),
  KEY `idx_student_notif_type` (`type`),
  KEY `idx_student_notif_read` (`readAt`),
  CONSTRAINT `student_notification_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_notification_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_notification`
--

LOCK TABLES `student_notification` WRITE;
/*!40000 ALTER TABLE `student_notification` DISABLE KEYS */;
INSERT INTO `student_notification` VALUES ('04bff388-351c-4210-8fb4-6ea0975ba240','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('0718cd14-4d44-4b64-a348-471c25932f7a','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('097125ab-5efe-471b-9dc1-98ef8dfa3689','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('09732ad7-2e0e-41c6-8633-a606e52a9098','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_failed','Quiz failed','toto failed the quiz for Python Programming with 40.00% (attempt #1).','2026-04-01 01:22:57',NULL),('0cd1253b-43f4-4acb-ac10-0e2956596d72','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('10040c89-0281-4f72-ad21-7173a553dec9','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('108678a8-03c6-4733-8eb7-b845f7a8138e','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('128abbf6-a7d4-4a93-bf88-8573df06d298','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('12d30135-2bd3-40ff-9b76-a775b64287c9','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('12fe1f35-b0e2-4325-b265-3ecaf19306b7','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('14c3c3d4-d7dc-49f4-b3e5-7a1ab92290d8','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52','2026-03-31 23:58:08'),('194e82b0-f35b-4dbe-9d07-47aa0bfd0c12','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('19b170ac-fcc2-45e4-868e-270fc34f713f','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('1b2cbc28-5818-41ea-a794-5321cacefb2b','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('1d51898b-b580-49e3-ab06-058dd9170b39','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('1dd3c306-dbd7-4cbc-b9f1-a8447efdb4e1','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('226da37b-e147-4b73-8b67-1c230f429c1d','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05','2026-03-31 23:58:08'),('2276844b-1f58-47c4-9033-8315b5ca35f0','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('236fd87e-5404-4bea-9b31-29a7b5ca8e65','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('24971cb0-969d-4617-a18e-1e93b5840254','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('260592a1-30b0-4de5-8c23-23353915bd6c','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('286a7d24-4997-4b60-87f9-820a0f039265','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('2884d7d2-9aec-4153-b38a-ecb8f3e273e3','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05','2026-03-31 23:58:08'),('28a39193-ff77-4cef-b627-f7ad291b25c2','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('28de9eeb-46b6-4a4e-befb-1974fb5a4a76','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('2cd10b5f-3e40-4de5-a993-4a02f527046f','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('30a05522-4121-4901-83e7-464f463938f4','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','certificate_earned','Certificate unlocked after retake','toto retook the quiz and unlocked the certificate for Python Programming.','2026-04-01 01:23:35',NULL),('3638e440-682d-45ec-8bdb-64558c3c628c','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('389bb751-f2b3-4b51-9fde-0797dc455ef3','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('3937d6ee-67aa-4992-b027-a3a7253539ac','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('39fe82f7-4129-45ce-984b-7564c4f7d9c6','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('3a7f35bd-5820-47a9-9a84-7e90cc2a927f','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('3e319d06-e2b9-4ddb-b86c-3d551bf3cc95','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('3e3aea21-55e9-42d5-9913-a3c183c1e516','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('3e3edb5c-9e13-49a3-b758-a7026f5d660e','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('3ea7386d-9449-48f2-b22c-14a9baaf91ad','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('3f9687ac-0470-4839-a839-fe2fe1c616b4','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('427727a6-fe95-4dc7-be95-3a2e831eaef8','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('44105afe-a773-4f24-880b-961c391f843e','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('465a95d1-9be7-4f75-8727-41e6bf1d87e8','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('4c1092b6-0a1b-4eee-8ada-5a32e77be48e','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('4e0ab01f-1760-42bc-be0a-80e0d7e54a0d','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('4e1086c7-466d-453b-84c9-11d9d6bb116f','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('4f066bcd-abbf-4dc3-b6fe-a36f979e7b19','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_passed','Quiz passed','talia passed the quiz for Python Programming with 100.00% (attempt #1).','2026-03-31 21:15:04',NULL),('50edbf33-5762-4176-a3d3-d07c84c20275','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('53eece74-fa66-47ab-a82e-b93d8d355034','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('54140656-aa2a-419e-93b0-ef38606b373c','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('59d83e0f-8ac5-4fc3-bc2b-6ddb9423a277','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('5c21df7b-c0cd-439c-826a-437114f5376e','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('5e1e080e-6b8b-4e5d-a296-d683e5a20092','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('5e83e529-2ae4-4d62-80e3-bdbf1a341ef6','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('60ae8065-8b69-473a-8c05-d403906ab928','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('60b037d9-25d7-4f0b-aa6d-2867e67aef24','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('6217b072-0b0c-4006-ab5b-e0e06127ec9a','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('62e4f9cd-3b27-47e1-b7a1-34be1779e310','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('688a3619-5222-4335-841f-79c6a9a0465b','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('6890940b-3439-46f4-a44d-c5b7e9f0f183','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('69be9e44-7e8e-4807-9b73-4eb5aa3c4a63','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('6a9b2115-336c-4090-a670-921faa3b703c','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_passed','Quiz passed','toto passed the quiz for Python Programming with 80.00% (attempt #2).','2026-04-01 01:23:35',NULL),('6e8f6f6d-118e-4c40-8bad-dc94725f91d6','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('6ff928f7-291d-494e-98ea-086a11fdec2b','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('7161bd50-ce98-4a56-8553-cf11d7a1982b','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('72c914e8-8a72-47c9-aa14-4d718fa58960','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05','2026-03-31 23:58:08'),('735087b5-09d4-4421-8ac8-573d35ecd2dc','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('7438e61b-d284-463b-be7f-9ac7ea697322','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31','2026-03-31 23:58:08'),('74f9fc54-bd6c-4089-b7ec-de4e65811122','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('76c575bf-6b61-4316-92ed-0d42353d915b','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('7ad14964-dab3-40dd-87d5-ffabe6b3aec6','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('7c22e06a-c003-46b4-8736-f1969140a2c4','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31','2026-03-31 23:58:08'),('7cabd80a-cdd2-4967-928f-a19c919dd9c4','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('80a68781-af82-4699-8a11-41e56dc28353','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('81347c24-9230-4149-9d51-a294e1e4d4c5','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('83c95b89-d85b-4c9b-9ca6-cdcf40222b24','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('864715e2-9782-4251-bb33-8adba8e80996','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('864a09ed-1ec7-44d6-9b85-0a961a0ad8e2','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('89ad3700-b1c8-4d50-ba8c-a69dcae56940','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('8b0c07dd-65ec-4a75-91a3-765ca53fd826','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','certificate_earned','Certificate unlocked','nasser unlocked the certificate for Python Programming.','2026-04-01 01:16:50',NULL),('8bbc6673-10e6-4494-a72c-441b4a632786','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('8df6887a-5495-4d1e-bfa2-705248acaabb','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('8f0d5525-8ce3-4ebe-9c14-ecaceeb6f42c','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('91c141f0-07ed-4e77-a20a-4975f05edec5','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_passed','Quiz passed','nasser passed the quiz for Python Programming with 70.00% (attempt #1).','2026-04-01 01:16:50',NULL),('957bbd0f-3141-43c2-9290-87f1d119fab9','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55','2026-03-31 23:58:08'),('98166ded-3570-46ba-a0dd-f0b5d5378d06','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('9a6ba7e5-9387-4224-8b9a-b833660f4168','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('9ca3eb14-f77b-47e7-909b-5cc61c51f37c','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('9da2edec-5056-40fb-8551-3044acbd715f','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('9f4c79a0-8107-4aa7-9b5c-8d75c65fe6d6','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('9f5fd305-09a9-4b74-a0e7-2d4ca48ec970','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('9fa5e2da-8f89-4d47-af06-31d972ed9289','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('a00fe2cd-3479-421b-bb3e-642f3c7dda75','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05','2026-03-31 23:58:08'),('a1f3f525-9675-4567-9a34-3e2210bd31aa','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('a22fa466-c7d4-431f-8a61-cc2e0023fd19','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('a4b2b76b-8604-42c9-917a-0f423a7cee94','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('a616e91c-922f-467d-bb3b-80e5989a8f2d','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('a6f9cad9-365e-4995-ab97-0aa77933e590','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('aa1691a8-a257-45d6-a9d1-1cdf0696a7f5','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('ac0e41f3-6d32-4485-a396-d273053e14e0','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('ad49a624-24e8-471d-8a56-aef2c095a19f','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('ad570036-41a7-457a-9495-74d36bbae9ee','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('b03b455a-39ad-4294-b7ae-a54221d56401','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('b0b0ea41-a275-4530-adbb-05ba81b700c2','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('b33d4e5e-0268-4d2f-a1ca-a88465e32043','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('b472ece8-271b-45e8-b8e5-e5d0917db48b','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15','2026-03-31 23:58:08'),('b4d3972b-d82b-47f9-b8ca-ad72d7c9608c','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('b61261f2-5921-49c5-a771-f468738ff4c3','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('b9fa414b-af4c-4893-a2aa-1838a022dd4b','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('badb3082-f693-4b04-8c58-399ad2490561','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49','2026-03-31 23:58:08'),('bd91566f-0c2d-4a54-9f70-7e1213fc5250','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('bf02d1cb-642a-4732-a4e5-c239e5cead35','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('bf59353d-a261-4ebc-a69d-e07b7833b7e0','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('bfd78ce2-4c33-4f97-8b0b-47a413860e08','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('c08ba3a4-fb05-494a-9045-e7e012b81ae5','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('c2cf6d26-f997-4cde-be62-c5a7bf2a0f30','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('c5ef1b6d-d990-4120-bd57-b0f7360dc284','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('ce6b965d-476c-4653-9d07-e108813f413f','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('cef62ec5-59cf-43a3-88cd-b442d05c4080','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('cfb7d6ec-9459-4747-a8c6-1ed9db4db155','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('d150d5d3-00ea-46c5-8ce4-2d92529cd698','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25',NULL),('d18a1dd9-7585-4936-b0b0-973ef36b96d1','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-08 at 15:00.','2026-03-31 23:33:05',NULL),('d2597d17-9283-40dd-947a-b1066cfb919b','b6c714e4-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('d323d43d-77d3-4f0c-bbcb-094cbbbb93df','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('d89d3459-323c-4ba7-8e80-fab542d97726','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('da8ae27e-248d-44ae-ad6d-cb448f5ffb2b','57967169-2842-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('de9c67c8-5860-436e-a00d-978b1f4fc49e','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('e0541898-0db5-4757-8508-34205940404c','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('e14d3d8e-291c-4e95-9906-73637d88e86d','3def91a4-1bac-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('e4568cdd-7d36-441e-a6c9-111324c3a736','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:50:25','2026-03-31 23:58:08'),('e5abb3e7-15e9-44c3-a454-2332b95e51a1','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:05',NULL),('e628cbb4-58e1-4d18-88a9-144048862278','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('e6f5486d-f94a-4a4e-81e0-547c8e994aaa','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:33:31',NULL),('ea506739-21c5-454b-94a3-3b6a2e4f9523','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('ed146e8d-b0b7-4ea2-b96b-378dde135c32','ceb02830-1a95-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:05',NULL),('ee457208-344d-4496-8bb9-a5af6a6765db','33fe4baa-2d42-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('f15560d6-61a6-438c-b1c9-7c10a94da619','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('f1582a19-0685-4c2f-9859-91669920cbd0','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:54:55',NULL),('f1b60bba-be6f-4338-a06b-eeabd461d719','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('f34e969a-77a5-43a6-8616-842d68bec884','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:50:15',NULL),('f3a89c5b-4000-46c3-9825-22be4b18b8a6','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('f3b5b72e-ecb4-48d8-941e-c4452709d368','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:53:31',NULL),('f49cfb0e-647b-485b-b0a6-684a9dac47e1','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','certificate_earned','Certificate unlocked','talia unlocked the certificate for Python Programming.','2026-03-31 21:15:04',NULL),('f5056aa2-c582-4c07-9669-999ad4a04e00','f74bdb60-2acf-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05','2026-03-31 23:58:08'),('f8d60b18-98ef-4a4b-a503-0973e7ced9b4','fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:33:05',NULL),('fbae3325-3ecc-4754-b752-ffca2d3bb37a','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-22 at 15:00.','2026-03-31 23:51:52',NULL),('fd107abc-434e-455d-b242-0140583c77cf','955acab2-18fd-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL),('ff0b9570-8619-4fd9-bbc6-14a290b2d41f','820b3b3c-2c26-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session reminder','Reminder: live session for Python Programming on 2026-04-01 at 15:00.','2026-03-31 23:44:49',NULL),('ffdd0b07-29cb-45e0-81bb-1786367c55c4','c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','live_session','Live session scheduled','Live session scheduled for Python Programming on 2026-04-15 at 15:00.','2026-03-31 23:33:05',NULL);
/*!40000 ALTER TABLE `student_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_notification`
--

DROP TABLE IF EXISTS `teacher_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_notification` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'quiz_result',
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_teacher_notif_teacher` (`teacherId`),
  KEY `idx_teacher_notif_created` (`createdAt`),
  KEY `idx_teacher_notif_read` (`readAt`),
  KEY `studentId` (`studentId`),
  KEY `courseId` (`courseId`),
  CONSTRAINT `teacher_notification_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `teacher_notification_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `teacher_notification_ibfk_3` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_notification`
--

LOCK TABLES `teacher_notification` WRITE;
/*!40000 ALTER TABLE `teacher_notification` DISABLE KEYS */;
INSERT INTO `teacher_notification` VALUES ('1bde4e0c-0bfd-4d88-9cfb-df89769cf9cf','f1779632-1905-11f1-97b2-6c02e0d26821','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_certificate','Certificate unlocked','talia unlocked the certificate for Python Programming.','2026-03-31 21:15:04',NULL),('1d53ba55-e4c3-45db-a80a-30c28fbef1ab','f1779632-1905-11f1-97b2-6c02e0d26821','598cdd8a-2d2d-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_result','Quiz passed','talia passed the quiz for Python Programming with 100.00% (attempt #1).','2026-03-31 21:15:04',NULL),('487dc095-8069-4bec-875f-0209bd264e7e','f1779632-1905-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_result','Quiz passed','toto passed the quiz for Python Programming with 80.00% (attempt #2).','2026-04-01 01:23:35',NULL),('4ee6a2bf-1e93-41f9-be13-ecc627ebd552','f1779632-1905-11f1-97b2-6c02e0d26821','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_result','Quiz passed','nasser passed the quiz for Python Programming with 70.00% (attempt #1).','2026-04-01 01:16:50',NULL),('6a2c5538-d314-44a9-b4ad-812c7a5bc4f2','f1779632-1905-11f1-97b2-6c02e0d26821','47c1d5ab-2d46-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_certificate','Certificate unlocked','nasser unlocked the certificate for Python Programming.','2026-04-01 01:16:50',NULL),('75331f9e-fd25-49d2-b551-4aefa2adc574','f1779632-1905-11f1-97b2-6c02e0d26821',NULL,'4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_result','Quiz passed','╪د┘╪د╪ة ┘╪د╪╡╪▒ ╪ص╪│┘è┘ ╪»┘è╪▒┘è passed the quiz for Python Programming with 80.00% (attempt #1).','2026-03-31 20:40:59',NULL),('8ce88216-f637-43b3-8dec-45b1a1ad61ed','f1779632-1905-11f1-97b2-6c02e0d26821','437c1b23-1bab-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_result','Quiz passed','alaa-dere passed the quiz for Python Programming with 60.00% (attempt #1).','2026-03-31 20:26:47',NULL),('d254bd0e-3031-4cb9-8fd6-5cf8e119b774','f1779632-1905-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_certificate','Certificate unlocked after retake','toto retook the quiz and unlocked the certificate for Python Programming.','2026-04-01 01:23:35',NULL),('e0ba9d3c-d704-40ff-bb1e-35cc6fb63d80','f1779632-1905-11f1-97b2-6c02e0d26821','e0183a49-2d4f-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','quiz_result','Quiz failed','toto failed the quiz for Python Programming with 40.00% (attempt #1).','2026-04-01 01:22:57',NULL);
/*!40000 ALTER TABLE `teacher_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `providerId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_roleId` (`roleId`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('33fe4baa-2d42-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','╪د┘╪د╪ة ┘╪د╪╡╪▒ ╪ص╪│┘è┘ ╪»┘è╪▒┘è','s12216968@stu.najah.edu','$2b$10$z7xmaaCTZ/.fJqSOxyYrX.2oSEenSS1fT3my9uBFAhlR0fe0gZEgW','active','2026-03-31 23:42:58','2026-03-31 23:42:58',NULL,NULL,NULL),('3def91a4-1bac-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Lana Nasser','lana@gmail.com','$2b$10$5MzMd7PX/ER8.Oex7K/f7.eumaJOZ9HyxAGdARe/yk3e2dfc2fn8m','active','2026-03-09 13:36:41','2026-03-09 13:36:41',NULL,NULL,NULL),('437c1b23-1bab-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','alaa-dere','199634564@users.noreply.github.com','$2b$10$1LSMy1sh3Eus.WJJx14WK.stN0g2Ogd/js1.GAVuWAHzcVabmAJiW','active','2026-03-09 13:29:41','2026-03-09 13:29:41',NULL,NULL,NULL),('47c1d5ab-2d46-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','nasser','nasser@gmail.com','$2b$10$AN3XfwRN9ZzfmiyM5lbb3OKYbqOHDWa1k/0WLZSz0rUzIYkUCQ.ta','active','2026-04-01 00:12:09','2026-04-01 00:12:09',NULL,NULL,NULL),('57967169-2842-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Nour','nour@gmail.com','$2b$10$g/f9zJKnDgwBfRjRadlDQemLs1V/lzt0EwihfjDRP1R46d5SHpzTe','active','2026-03-25 14:01:22','2026-03-27 21:43:11',NULL,NULL,'/uploads/profiles/57967169-2842-11f1-97b2-6c02e0d26821-1774628711500.jpg'),('598cdd8a-2d2d-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','talia','talia@gmail.com','$2b$10$vj/BbnhXYtbCQalLSoyKfOOXgjQyK.wo5Y1r3HKse79/wvi/qkYwm','active','2026-03-31 21:13:42','2026-03-31 21:13:42',NULL,NULL,NULL),('820b3b3c-2c26-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','jihad','jihad@gmail.com','$2b$10$Bk1ypXeMO1rydvtfgztJhucllmA3.YdlaHgxtlcrj8fphtAH6NTCS','active','2026-03-30 13:52:12','2026-03-30 13:52:12',NULL,NULL,NULL),('955acab2-18fd-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Masa Ahmad','masa@gmail.com','$2b$10$/J3r8QXTAiDs1phDaHR2P.hasx1SEbyXHH.hDtom.e9ooSlHj8rtW','active','2026-03-06 03:41:23','2026-03-06 03:41:23',NULL,NULL,NULL),('a3891b1e-1bab-11f1-97b2-6c02e0d26821','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Batool Jamoos','batool@gmail.com','$2b$10$7pJyEGfW2u7lHboeiLjKLuHaKDDGRZms4w9lDamQvkcp9G5AwnteO','active','2026-03-09 13:32:22','2026-03-09 13:32:22',NULL,NULL,NULL),('b6c714e4-1bab-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','Doaa Zaid','doaa@gmail.com','$2b$10$pvuwD7JVGjsklY5Is.0t8.NK.pnYJpL/AUv/xDxbCJOvxY2S4GzSi','active','2026-03-09 13:32:54','2026-03-09 13:32:54',NULL,NULL,NULL),('ba9e888a-18fc-11f1-97b2-6c02e0d26821','3ea888ae-18fa-11f1-97b2-6c02e0d26821','Administrator','admin@aivora.com','$2b$10$p08Ik85M4xCoxXgT.ytImecBZkNAoC4hE3LkjSehr2tCaIlQNiXRi','active','2026-03-06 03:35:16','2026-03-06 03:35:16',NULL,NULL,NULL),('c8e9f78f-2a8d-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','omar','omar@gmail.com','$2b$10$Upb8quxm5s16A4u05zX/AuzEsdokDrc9MV4E1Tufr3XuLTvh2/7X2','active','2026-03-28 13:06:27','2026-03-28 13:06:27',NULL,NULL,NULL),('ceb02830-1a95-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','alaa dere','alaadere35@gmail.com','$2b$10$24Canx/msOcoofDNgbB9POrkM/AFg2Q/aT5mWyCkt9LyTFppq7Jeu','active','2026-03-08 04:23:34','2026-03-27 18:17:07',NULL,NULL,'/uploads/profiles/ceb02830-1a95-11f1-97b2-6c02e0d26821-1774628218946.png'),('e0183a49-2d4f-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','toto','toto@gmail.com','$2b$10$49BpgawbpS1HaZS69rukcOlugaNPkxfANNAFMX9//kmbPbpxeHMBK','active','2026-04-01 01:20:51','2026-04-01 01:20:51',NULL,NULL,NULL),('f1779632-1905-11f1-97b2-6c02e0d26821','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Manal AbuZayed','manal123@gmail.com','$2b$10$i3uOpUvGEMVd0SdBDVLnXOay8XfhyHoxQFrSfAFnF0O0wvcRnA2tO','active','2026-03-06 04:41:14','2026-03-06 04:41:14',NULL,NULL,NULL),('f74bdb60-2acf-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','meme','meme@gmail.com','$2b$10$YrFpC853zozdPsSV7ZwgXuf3.G9NgQRLcWIQONrQdEPvQ2ILH6Y0W','active','2026-03-28 21:00:12','2026-03-28 21:00:12',NULL,NULL,NULL),('fcaa82e7-2ad0-11f1-97b2-6c02e0d26821','3ea8c854-18fa-11f1-97b2-6c02e0d26821','ola abdo','ola@gmail.com','$2b$10$Uv706CBB8H7y5EHRy0vGEuO0w7GLfD.m/VAtl.yXjuB74Bf.K9Ipu','active','2026-03-28 21:07:30','2026-03-28 21:07:30',NULL,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-01  1:26:53


