-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: aivora_db
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('7ce3e0dd-370b-4d74-bb02-1e053a4aa092','76d65994592870fb335b9c5e8da89b20c586bdd771ad64cf37e23683e721d177','2026-03-02 17:49:15.814','20260302174915_init_roles_users',NULL,NULL,'2026-03-02 17:49:15.714',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course`
--

DROP TABLE IF EXISTS `course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `coverImage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'رابط صورة غلاف الكورس (thumbnail/cover)',
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `status` enum('draft','published','archived') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `teacherSharePct` int DEFAULT NULL,
  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durationWeeks` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_teacherId` (`teacherId`),
  CONSTRAINT `course_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course`
--

LOCK TABLES `course` WRITE;
/*!40000 ALTER TABLE `course` DISABLE KEYS */;
INSERT INTO `course` VALUES ('168ec876-1c9f-11f1-9455-00090ffe0001','python','python',NULL,'3add5b47-1a34-11f1-9a31-00090ffe0001',170.00,'published','2026-03-10 18:35:02','2026-03-10 18:35:02',70,'/uploads/courses/1773160502895-python.jfif',9),('3543d924-1c9d-11f1-9455-00090ffe0001','Web','web',NULL,'89a81014-1abe-11f1-9455-00090ffe0001',150.00,'published','2026-03-10 18:21:35','2026-03-10 18:21:35',70,'https://via.placeholder.com/1280x720?text=Web',8);
/*!40000 ALTER TABLE `course` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollment`
--

DROP TABLE IF EXISTS `enrollment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrolledAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('enrolled','in_progress','completed','dropped') COLLATE utf8mb4_general_ci DEFAULT 'enrolled',
  `progressPercentage` decimal(5,2) DEFAULT '0.00',
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`studentId`,`courseId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_courseId` (`courseId`),
  CONSTRAINT `enrollment_courseid_foreign` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `method` enum('card','paypal') COLLATE utf8mb4_general_ci DEFAULT 'card',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment_payment` (`enrollmentId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_courseId` (`courseId`),
  KEY `idx_createdAt` (`createdAt`),
  CONSTRAINT `enrollment_payment_ibfk_1` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollment_payment_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollment_payment_ibfk_3` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollment`
--

LOCK TABLES `enrollment` WRITE;
/*!40000 ALTER TABLE `enrollment` DISABLE KEYS */;
/*!40000 ALTER TABLE `enrollment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `enrollment_payment`
--

LOCK TABLES `enrollment_payment` WRITE;
/*!40000 ALTER TABLE `enrollment_payment` DISABLE KEYS */;
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
  `type` enum('enrollment','refund') COLLATE utf8mb4_general_ci DEFAULT 'enrollment',
  `status` enum('success','failed','pending') COLLATE utf8mb4_general_ci DEFAULT 'success',
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherShare` decimal(10,2) DEFAULT '0.00',
  `platformShare` decimal(10,2) DEFAULT '0.00',
  `method` enum('wallet','card','cash','paypal') COLLATE utf8mb4_general_ci DEFAULT 'card',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finance_transaction`
--

LOCK TABLES `finance_transaction` WRITE;
/*!40000 ALTER TABLE `finance_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `finance_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_notification`
--

DROP TABLE IF EXISTS `admin_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notification` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('student_signup','course_enroll','teacher_message') COLLATE utf8mb4_general_ci DEFAULT 'student_signup',
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_readAt` (`readAt`),
  KEY `idx_type` (`type`),
  CONSTRAINT `admin_notification_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `admin_notification_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notification`
--

LOCK TABLES `admin_notification` WRITE;
/*!40000 ALTER TABLE `admin_notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_notification` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_teacher_thread`
--

LOCK TABLES `admin_teacher_thread` WRITE;
/*!40000 ALTER TABLE `admin_teacher_thread` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_teacher_thread` ENABLE KEYS */;
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
  `senderRole` enum('admin','teacher') COLLATE utf8mb4_general_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_threadId` (`threadId`),
  KEY `idx_senderId` (`senderId`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_readAt` (`readAt`),
  CONSTRAINT `admin_teacher_message_ibfk_1` FOREIGN KEY (`threadId`) REFERENCES `admin_teacher_thread` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_teacher_message_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_teacher_message`
--

LOCK TABLES `admin_teacher_message` WRITE;
/*!40000 ALTER TABLE `admin_teacher_message` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_teacher_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lesson`
--

DROP TABLE IF EXISTS `lesson`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `moduleId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `videoUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderNumber` int NOT NULL,
  `durationMinutes` int DEFAULT '0',
  `isPublished` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lesson_order` (`moduleId`,`orderNumber`),
  KEY `idx_moduleId` (`moduleId`),
  CONSTRAINT `lesson_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lesson`
--

LOCK TABLES `lesson` WRITE;
/*!40000 ALTER TABLE `lesson` DISABLE KEYS */;
/*!40000 ALTER TABLE `lesson` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessonprogress`
--

DROP TABLE IF EXISTS `lessonprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessonprogress` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrollmentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lessonId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `progressPercentage` decimal(5,2) DEFAULT '0.00',
  `startedAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`enrollmentId`,`lessonId`),
  KEY `idx_enrollmentId` (`enrollmentId`),
  KEY `idx_lessonId` (`lessonId`),
  CONSTRAINT `lessonprogress_ibfk_1` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lessonprogress_ibfk_2` FOREIGN KEY (`lessonId`) REFERENCES `lesson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessonprogress`
--

LOCK TABLES `lessonprogress` WRITE;
/*!40000 ALTER TABLE `lessonprogress` DISABLE KEYS */;
/*!40000 ALTER TABLE `lessonprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `orderNumber` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order` (`courseId`,`orderNumber`),
  KEY `idx_courseId` (`courseId`),
  CONSTRAINT `module_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passwordresettoken`
--

DROP TABLE IF EXISTS `passwordresettoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passwordresettoken` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `userId` (`userId`),
  KEY `idx_token` (`token`),
  CONSTRAINT `passwordresettoken_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordresettoken`
--

LOCK TABLES `passwordresettoken` WRITE;
/*!40000 ALTER TABLE `passwordresettoken` DISABLE KEYS */;
INSERT INTO `passwordresettoken` VALUES ('2ab1d3a2-1a96-11f1-9a31-00090ffe0001','07f03bff-1a96-11f1-9a31-00090ffe0001','4dc866ebbd84786b40885e6c2763ef6bd360b3bc09cbfcda36c6bd2cfe036a9c','2026-03-08 05:26:09','2026-03-08 04:26:08');
/*!40000 ALTER TABLE `passwordresettoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Role_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES ('cmm9jovx70000uhv4fwhwak28','admin'),('cmm9jovy00002uhv4h71y7uw4','student'),('cmm9jovxr0001uhv4l966rtz1','teacher');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_roleId_idx` (`roleId`),
  CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('07f03bff-1a96-11f1-9a31-00090ffe0001','cmm9jovy00002uhv4h71y7uw4','بتول سعد محمد جاموس','s12217104@stu.najah.edu','$2b$10$sCZw3MmszKXdDPyLJMiHhOoo3PEK8t8pq1cPoT3zwqIcG00pzQcHK','active','2026-03-08 04:25:10.000','2026-03-08 04:25:10'),('20d560d6-1a34-11f1-9a31-00090ffe0001','cmm9jovy00002uhv4h71y7uw4','Aseel Jamous','aseeljamous@gmail.com','$2b$10$jXTkwpErVzNw3aKhJhT7JuMVYSUk2C5mt36q2tk3FCcGJOn6eJFIm','inactive','2026-03-07 16:44:21.666','2026-03-07 20:31:16'),('36b3d1af-1a94-11f1-9a31-00090ffe0001','cmm9jovy00002uhv4h71y7uw4','Batool Jamous','jamousbatool317@gmail.com','$2b$10$wmMqlKKJEKYnBGSR8PJ/4Omor1tvTncI1PAW7pxLkgcXn5mhELLoG','active','2026-03-08 04:12:10.000','2026-03-08 07:54:11'),('3add5b47-1a34-11f1-9a31-00090ffe0001','cmm9jovxr0001uhv4l966rtz1','Haneen Ali','haneenali@gmail.com','$2b$10$AB.9rKc4JlELK.jxZbaBJOJP23D.8bPaNGYevfjVUYhKZWroQap1e','active','2026-03-07 16:45:05.000','2026-03-07 21:03:25'),('517d27f3-1801-11f1-9a31-00090ffe0001','cmm9jovy00002uhv4h71y7uw4','Batool Jamous','batooljamous@gmail.com','$2b$10$NQDAsWP5THj/UtaW6UY2EuC/9iehXuw7WxIp.neIzqG2AOkoH7gCW','active','2026-03-04 21:35:36.638','2026-03-04 21:35:36'),('781afc0b-18b9-11f1-9a31-00090ffe0001','cmm9jovxr0001uhv4l966rtz1','Batool Saad','batoolsaad@gmail.com','$2b$10$wgwFNa1W0wp8wSXt8XwCcOFvMtNTQQeW9tmeAOYCLHUv.zADcE2R6','active','2026-03-05 19:33:48.000','2026-03-05 19:33:48'),('88f264fc-18b8-11f1-9a31-00090ffe0001','cmm9jovy00002uhv4h71y7uw4','Omar Jamous','omarjamous@gmail.com','$2b$10$l..h/TQJj35by7gKHrvlmO/i3.vsJrONqf5Ddv5vXzq.zLZVDfi3C','active','2026-03-05 19:27:07.572','2026-03-05 19:27:07'),('89a81014-1abe-11f1-9455-00090ffe0001','cmm9jovxr0001uhv4l966rtz1','Batool Jamous','jamousbatool@gmail.com','$2b$10$4GvHrNQnDGxsbvmWHUw/yO01BhidSkQNdCtfIYisozqxTejTYK3Mq','active','2026-03-08 09:15:08.000','2026-03-08 09:15:08'),('9792cefa-1da6-11f1-9455-00090ffe0001','cmm9jovxr0001uhv4l966rtz1','Noor Jamous','noorjamous@gmail.com','$2b$10$p.tOwInReoJHFwFp6sb2M.018lxYHFXm0QW79zJF4gpJ3p1S3sg8e','active','2026-03-12 02:01:16.000','2026-03-12 02:01:16'),('a1fe9ec1-1800-11f1-9a31-00090ffe0001','cmm9jovxr0001uhv4l966rtz1','Haya Ali','hayaali@gmail.com','$2b$10$EdWw7BPuNIOV9OJ.DmmIV.8lb.8tRdaIhl4jDdUOL3uZQFqJiHizi','active','2026-03-04 21:30:42.207','2026-03-04 21:35:59'),('cmm9jow050004uhv4uvr4521s','cmm9jovx70000uhv4fwhwak28','Admin User','admin@aivora.com','$2b$10$cMtCzmO7NQrM37hqNWGkw.t0koViB9Su7gk16pdHTuZ/vE3xlv.te','active','2026-03-02 19:01:31.013','2026-03-02 19:01:31'),('e00e693b-17f8-11f1-9a31-00090ffe0001','cmm9jovy00002uhv4h71y7uw4','Alaa Dere','alaadere@gmail.com','$2b$10$o6qQzFqkFB5UWBn9CS6c.eDxot1DFkuzlUmymlRgvq/8kA/59xsgK','active','2026-03-04 20:35:10.356','2026-03-04 21:34:33');
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

-- Dump completed on 2026-03-25 13:41:42
