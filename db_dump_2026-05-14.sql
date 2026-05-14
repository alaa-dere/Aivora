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
-- Table structure for table `admin_teacher_message`
--

DROP TABLE IF EXISTS `admin_teacher_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_teacher_message` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `threadId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderRole` enum('admin','teacher') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
/*!40000 ALTER TABLE `admin_teacher_thread` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_name` (`name`),
  KEY `idx_category_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
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
  `senderRole` enum('student','teacher') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
/*!40000 ALTER TABLE `chat_message` ENABLE KEYS */;
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
  `descriptionAr` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `teacherSharePct` int DEFAULT '60',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durationWeeks` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_teacherId` (`teacherId`),
  KEY `idx_categoryId` (`categoryId`),
  CONSTRAINT `course_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_course_category` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course`
--

LOCK TABLES `course` WRITE;
/*!40000 ALTER TABLE `course` DISABLE KEYS */;
INSERT INTO `course` VALUES ('4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Python Programming','This course introduces learners to the fundamentals of Python programming, one of the most widely used programming languages in software development, data science, artificial intelligence, and automation. Students will learn programming concepts such as variables, control structures, functions, and object-oriented programming while developing practical programs and solving real-world problems. The course gradually progresses from basic syntax to advanced concepts like file handling, modules, and working with external libraries.\r\n\r\nPython is known for its simple syntax, readability, and large ecosystem of libraries, making it an ideal language for beginners and professionals alike. By the end of this course, students will be able to write efficient Python programs and apply programming skills in various applications.',NULL,'fb9e6f39-4f78-11f1-ba5b-00090ffe0001',NULL,20.00,60,'draft','2026-03-15 15:53:12','2026-05-14 12:58:36','/uploads/courses/course-4f0dd6ed-2076-11f1-97b2-6c02e0d26821-1773615294920.webp',3);
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
/*!40000 ALTER TABLE `course_quiz_attempt_answer` ENABLE KEYS */;
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
  `status` enum('enrolled','in_progress','completed','dropped') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'enrolled',
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
  `method` enum('card','paypal','wallet','cash') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'card',
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
/*!40000 ALTER TABLE `enrollment_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorite_course`
--

DROP TABLE IF EXISTS `favorite_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorite_course` (
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`studentId`,`courseId`),
  KEY `idx_favorite_course_student` (`studentId`),
  KEY `idx_favorite_course_course` (`courseId`),
  CONSTRAINT `fk_favorite_course_course` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorite_course_student` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorite_course`
--

LOCK TABLES `favorite_course` WRITE;
/*!40000 ALTER TABLE `favorite_course` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorite_course` ENABLE KEYS */;
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
  `type` enum('enrollment','refund','payout') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'enrollment',
  `status` enum('success','failed','pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherShare` decimal(10,2) DEFAULT '0.00',
  `platformShare` decimal(10,2) DEFAULT '0.00',
  `method` enum('wallet','card','cash') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'card',
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
/*!40000 ALTER TABLE `finance_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_path`
--

DROP TABLE IF EXISTS `learning_path`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_path` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `level` enum('beginner','intermediate','advanced','all_levels') COLLATE utf8mb4_general_ci DEFAULT 'beginner',
  `price` decimal(10,2) DEFAULT '0.00',
  `status` enum('draft','published','archived') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `estimatedHours` int DEFAULT '0',
  `createdBy` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  KEY `idx_learning_path_category` (`categoryId`),
  KEY `idx_learning_path_status` (`status`),
  CONSTRAINT `learning_path_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `learning_path_ibfk_2` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_path`
--

LOCK TABLES `learning_path` WRITE;
/*!40000 ALTER TABLE `learning_path` DISABLE KEYS */;
/*!40000 ALTER TABLE `learning_path` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_path_course`
--

DROP TABLE IF EXISTS `learning_path_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_path_course` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pathId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderNumber` int NOT NULL,
  `isRequired` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_path_course` (`pathId`,`courseId`),
  UNIQUE KEY `unique_path_order` (`pathId`,`orderNumber`),
  KEY `idx_learning_path_course_path` (`pathId`),
  KEY `idx_learning_path_course_course` (`courseId`),
  CONSTRAINT `learning_path_course_ibfk_1` FOREIGN KEY (`pathId`) REFERENCES `learning_path` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `learning_path_course_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_path_course`
--

LOCK TABLES `learning_path_course` WRITE;
/*!40000 ALTER TABLE `learning_path_course` DISABLE KEYS */;
/*!40000 ALTER TABLE `learning_path_course` ENABLE KEYS */;
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
  `type` enum('text','code_example','live_python','video_embed','quiz','mixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `enableLiveEditor` tinyint(1) NOT NULL DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'lesson content in Markdown + code blocks',
  `videoUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderNumber` int NOT NULL,
  `durationMinutes` int DEFAULT '0',
  `isPublished` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `codeContent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `liveEditorLanguage` enum('python','javascript','html_css') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'python',
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
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrollmentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lessonId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `status` enum('scheduled','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
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
/*!40000 ALTER TABLE `live_session_attendance` ENABLE KEYS */;
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
  CONSTRAINT `module_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
INSERT INTO `module` VALUES ('603620ee-20b0-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Python Basics','-Python Syntax and Indentation\n-Variables and Data Types\n-Numbers and Mathematical Operations\n-Strings and String Manipulation\n-Comments and Code Readability\n-Input and Output in Python',2,'2026-03-15 22:48:52','2026-03-15 22:48:52'),('7c0ea9ec-2079-11f1-97b2-6c02e0d26821','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','Introduction to Python','-What is Python?\n-History and Features of Python\n-Installing Python and Setting Up the Environment\n-Writing Your First Python Program\n-Understanding the Python Interpreter\n-Python IDEs (VS Code, PyCharm, Jupyter)',1,'2026-03-15 16:15:56','2026-03-15 21:55:53');
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipientId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipientRole` enum('admin','teacher','student') COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `relatedUserId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sourceTable` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sourceId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_recipient` (`recipientId`,`recipientRole`),
  KEY `idx_notification_created` (`createdAt`),
  KEY `idx_notification_type` (`type`),
  KEY `idx_notification_read` (`readAt`),
  KEY `idx_notification_source` (`sourceTable`,`sourceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES ('e7bbb2f7-4f75-11f1-ba5b-00090ffe0001','admin','admin','student_signup','New Student Account','Batool Jamous created a student account.','e7ba4ba0-4f75-11f1-ba5b-00090ffe0001',NULL,'admin_notification','e7bbb2f7-4f75-11f1-ba5b-00090ffe0001','2026-05-14 12:18:44','2026-05-14 12:20:05',NULL);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
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
-- Table structure for table `path_enrollment`
--

DROP TABLE IF EXISTS `path_enrollment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `path_enrollment` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pathId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrolledAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('enrolled','in_progress','completed','dropped') COLLATE utf8mb4_general_ci DEFAULT 'enrolled',
  `progressPercentage` decimal(5,2) DEFAULT '0.00',
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_path_enrollment` (`pathId`,`studentId`),
  KEY `idx_path_enrollment_path` (`pathId`),
  KEY `idx_path_enrollment_student` (`studentId`),
  CONSTRAINT `path_enrollment_ibfk_1` FOREIGN KEY (`pathId`) REFERENCES `learning_path` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `path_enrollment_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `path_enrollment`
--

LOCK TABLES `path_enrollment` WRITE;
/*!40000 ALTER TABLE `path_enrollment` DISABLE KEYS */;
/*!40000 ALTER TABLE `path_enrollment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recent_course_view`
--

DROP TABLE IF EXISTS `recent_course_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recent_course_view` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `courseId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastViewedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_recent_course_view` (`studentId`,`courseId`),
  KEY `idx_recent_student` (`studentId`),
  KEY `idx_recent_last_viewed` (`lastViewedAt`),
  KEY `courseId` (`courseId`),
  CONSTRAINT `recent_course_view_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recent_course_view_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recent_course_view`
--

LOCK TABLES `recent_course_view` WRITE;
/*!40000 ALTER TABLE `recent_course_view` DISABLE KEYS */;
INSERT INTO `recent_course_view` VALUES ('af39b3bc-c295-43cc-afe4-7f0338b3ef37','1bfc6618-30f3-11f1-9455-00090ffe0001','4f0dd6ed-2076-11f1-97b2-6c02e0d26821','2026-04-05 16:35:02','2026-04-05 16:27:10');
/*!40000 ALTER TABLE `recent_course_view` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `type` enum('live_session','missed_session','course_failed') COLLATE utf8mb4_general_ci DEFAULT 'live_session',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_notification`
--

LOCK TABLES `student_notification` WRITE;
/*!40000 ALTER TABLE `student_notification` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_notification`
--

LOCK TABLES `teacher_notification` WRITE;
/*!40000 ALTER TABLE `teacher_notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `providerId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
INSERT INTO `user` VALUES ('1742c61a-4f92-11f1-ba5b-00090ffe0001','3ea8c854-18fa-11f1-97b2-6c02e0d26821','nooppr','noor@gmail.com','$2b$10$oGn.FtpgbNYaUQNTtcYEXuf6WKtnVeuXyIgpAD0Kfcgas03ITjh1y','active','2026-05-14 15:40:29','2026-05-14 15:40:29',NULL,NULL,NULL),('454cde6d-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Ahmad Khaled','ahmad.khaled@aivora.com','$2b$10$S340ud8yTNRo7ppQK6lzBePfpNdgSpcUyMUq5l7.iyU4cDvWO8wp.','active','2026-01-05 09:10:00','2026-05-14 14:04:00',NULL,NULL,NULL),('454ce8f9-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Sara Nasser','sara.nasser@aivora.com','$2b$10$ZwDz7DIPXQrvaf02Gl4JEewXN9nL2T8FyrmhAvSTQz0HHNAUBrI0e','active','2026-01-12 14:25:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454ceadc-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Omar Zidan','omar.zidan@aivora.com','$2b$10$rXMLRyFWOV5/Ffj.z9kxGOANr0qglctbWKOMF2BXTy/Ziw/8TDZaO','active','2026-02-03 11:40:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454cecad-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Lina Adel','lina.adel@aivora.com','$2b$10$9U8Q35fSF6gUX6wbUxl5e.rptGlbFYSfc1X2w/SNtjdhJ11JzCcMa','active','2026-02-19 16:05:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454cee71-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Yousef Hani','yousef.hani@aivora.com','$2b$10$S8CezOHWqfq0tKrGwQDgIev51t1dB.c4xNIJ3XkAEN7ZU/0Zrb4kK','active','2026-03-08 10:15:00','2026-05-14 13:43:50',NULL,NULL,NULL),('454cf028-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Mariam Samer','mariam.samer@aivora.com','$2b$10$DXlKzJv78vUjcnEvfj8VienCLVpD89xOVTOiJhC/l3YBMLwt5rnF2','active','2026-03-22 13:50:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454cf180-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Kareem Tarek','kareem.tarek@aivora.com','$2b$10$8d6QfkvLEuCKh8pLFeAaL.HPGC8j1UGtGB6YdUzo7/.EmCMq8a6LG','active','2026-04-04 08:30:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454cf356-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Nour Fadi','nour.fadi@aivora.com','$2b$10$lWRgXPd/A7mA9VBMoilY8OTxB.GriovKTv.eEvtvqyUAs1iF6Y6i2','active','2026-04-18 15:20:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454cf521-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Hassan Majed','hassan.majed@aivora.com','$2b$10$O6AwjThCAj.86pPIYM7n4uSzOvCI8uOdUms1ROsSbcfjI6r28Xnm.','active','2026-05-02 12:45:00','2026-05-14 14:10:56',NULL,NULL,NULL),('454cfc91-4f80-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Dana Rami','dana.rami@aivora.com','$2b$10$4JGum3GJLF.lyRIf9kc2qOhkt6basjqsKX2vSVtei5yWFImmiLkvi','active','2026-05-10 17:10:00','2026-05-14 14:26:11',NULL,NULL,NULL),('ba9e888a-18fc-11f1-97b2-6c02e0d26821','3ea888ae-18fa-11f1-97b2-6c02e0d26821','Administrator','admin@aivora.com','$2b$10$p08Ik85M4xCoxXgT.ytImecBZkNAoC4hE3LkjSehr2tCaIlQNiXRi','active','2026-03-06 03:35:16','2026-03-06 03:35:16',NULL,NULL,NULL),('fb9e6f39-4f78-11f1-ba5b-00090ffe0001','3ea8c2fa-18fa-11f1-97b2-6c02e0d26821','Batool Jamous','jamousbatool317@gmail.com','$2b$10$M8yiiUMz3HK1thOQr7wxue7NpH6rbi0Sda8sjYDrtKfwLfjPaZGBW','active','2026-05-14 12:40:46','2026-05-14 15:37:05',NULL,NULL,'/uploads/profiles/fb9e6f39-4f78-11f1-ba5b-00090ffe0001-1778762221360.jfif');
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

-- Dump completed on 2026-05-14 19:23:25
