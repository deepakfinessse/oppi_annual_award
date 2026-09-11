-- ===========================================================
-- OPPI Annual Awards 2026 - Complete Database Setup Script
-- Database  : annual_awards
-- Charset   : utf8mb4 / utf8mb4_unicode_ci
-- Run as    : mysql -u avian -p < setup_annual_awards.sql
-- ===========================================================

-- 1. Create database
CREATE DATABASE IF NOT EXISTS `annual_awards`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `annual_awards`;

-- 2. Optional: Create user and grant privileges (adjust password as needed)
-- CREATE USER IF NOT EXISTS 'avian'@'localhost' IDENTIFIED BY 'aV1@nwysQL';
-- GRANT ALL PRIVILEGES ON `annual_awards`.* TO 'avian'@'localhost';
-- FLUSH PRIVILEGES;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- Table: allowed_domains
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `allowed_domains`;
CREATE TABLE `allowed_domains` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `domain` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `mobile` VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Organisation` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` ENUM('USER','VALIDATOR','JURY','PANEL_CHAIR','ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `reset_password_token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expiry` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: refresh_tokens
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` DATETIME(6) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `revoked_at` DATETIME(6) DEFAULT NULL,
  `device_info` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `IX_refresh_tokens_user_id` (`user_id`),
  CONSTRAINT `FK_refresh_tokens_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: applications
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `status` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `validator_id` INT DEFAULT NULL,
  `jury_id` INT DEFAULT NULL,
  `panel_chair_id` INT DEFAULT NULL,
  `submitted_at` DATETIME(6) DEFAULT NULL,
  `validator_action_at` DATETIME(6) DEFAULT NULL,
  `jury_action_at` DATETIME(6) DEFAULT NULL,
  `panel_chair_action_at` DATETIME(6) DEFAULT NULL,
  `rejection_reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IX_applications_user_id` (`user_id`),
  CONSTRAINT `FK_applications_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: personal_info (Stores Annual Awards nomination fields)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `personal_info`;
CREATE TABLE `personal_info` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL UNIQUE,
  `company_name` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `designation` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category_of_work` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `other_category` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_website` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_brief` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `innovation` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `competitive_analysis` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `need_analysis` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `marketability` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_personal_info_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: file_uploads
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `file_uploads`;
CREATE TABLE `file_uploads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `section` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` INT DEFAULT NULL,
  `file_type` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IX_file_uploads_application_id` (`application_id`),
  CONSTRAINT `FK_file_uploads_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: company_details
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `company_details`;
CREATE TABLE `company_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL UNIQUE,
  `customer_benefit` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `testimonial` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `employee_count` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `board_of_directors` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `investors_details` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `media_mentions` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `patents` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `product_benefits` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_company_details_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: company_reach
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `company_reach`;
CREATE TABLE `company_reach` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL UNIQUE,
  `marketing_strategy` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `app_details` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `website_details` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `social_media` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `physical_outlets` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `future_expansion` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_company_reach_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: applicant_details
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `applicant_details`;
CREATE TABLE `applicant_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL UNIQUE,
  `photo_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `title` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discipline` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `institute_category` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `institute_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_applicant_details_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: application_details
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `application_details`;
CREATE TABLE `application_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL UNIQUE,
  `category` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brief_statement` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `significant_contribution` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `impact_contribution` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `has_patent` TINYINT(1) DEFAULT NULL,
  `has_publication` TINYINT(1) DEFAULT NULL,
  `cv_file_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cv_file_name` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `auth_cert_file_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `auth_cert_file_name` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_application_details_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: patents
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `patents`;
CREATE TABLE `patents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_detail_id` INT NOT NULL,
  `title` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `type` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_attachment` TINYINT(1) DEFAULT NULL,
  `attachment_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `attachment_file_name` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_primary_writer` TINYINT(1) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `IX_patents_application_detail_id` (`application_detail_id`),
  CONSTRAINT `FK_patents_application_details_application_detail_id` FOREIGN KEY (`application_detail_id`) REFERENCES `application_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: validator_reviews
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `validator_reviews`;
CREATE TABLE `validator_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `validator_id` INT NOT NULL,
  `innovation_ip_score` INT NOT NULL,
  `team_strength_score` INT NOT NULL,
  `business_plan_score` INT NOT NULL,
  `impact_score` INT NOT NULL,
  `weighted_score` DOUBLE NOT NULL,
  `comments` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_draft` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_validator_reviews_application_id_validator_id` (`application_id`,`validator_id`),
  KEY `IX_validator_reviews_validator_id` (`validator_id`),
  CONSTRAINT `FK_validator_reviews_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_validator_reviews_users_validator_id` FOREIGN KEY (`validator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: jury_reviews
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `jury_reviews`;
CREATE TABLE `jury_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `jury_id` INT NOT NULL,
  `innovation_ip_score` INT NOT NULL,
  `team_strength_score` INT NOT NULL,
  `business_plan_score` INT NOT NULL,
  `impact_score` INT NOT NULL,
  `weighted_score` DOUBLE NOT NULL,
  `comments` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_draft` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_jury_reviews_application_id_jury_id` (`application_id`,`jury_id`),
  KEY `IX_jury_reviews_jury_id` (`jury_id`),
  CONSTRAINT `FK_jury_reviews_applications_application_id` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_jury_reviews_users_jury_id` FOREIGN KEY (`jury_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: panel_members
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `panel_members`;
CREATE TABLE `panel_members` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sort_order` INT NOT NULL DEFAULT 0,
  `email` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: past_winners
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `past_winners`;
CREATE TABLE `past_winners` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `year` INT NOT NULL,
  `category` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `color` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Table: audit_logs
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `entity_id` INT DEFAULT NULL,
  `details` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 3. Initial Default Seed Data (Default Users: Password is 'Admin@123')
-- ==========================================================
INSERT INTO `users` (`id`, `title`, `first_name`, `middle_name`, `last_name`, `dob`, `gender`, `email`, `mobile`, `Organisation`, `password_hash`, `role`, `is_active`, `is_deleted`, `created_at`)
VALUES
(1, NULL, 'Admin', NULL, 'User', NULL, NULL, 'admin@nivyam.com', NULL, 'OPPI Secretariat', '$2a$11$f5acaViWtp0xZm2iISBYwuAFbYutYdFH73l0njm3MR8M5z/P4xk/i', 'ADMIN', 1, 0, NOW()),
(2, NULL, 'Validator', NULL, 'User', NULL, NULL, 'validator@nivyam.com', NULL, 'Evaluation Committee', '$2a$11$rX4Zlp7KztgGmCcgomCGYOLVfvHMZGzAJHnGC./axZ/Jsi9d2CjH2', 'VALIDATOR', 1, 0, NOW()),
(3, NULL, 'Jury', NULL, 'User', NULL, NULL, 'jury@nivyam.com', NULL, 'Awards Jury', '$2a$11$3NNiTVDQEmQVEm7eqVD8vOmnDeAOoOf1UmVQp1XsFw0WWFv2CCOoO', 'JURY', 1, 0, NOW()),
(4, NULL, 'PanelChair', NULL, 'User', NULL, NULL, 'panelchair@nivyam.com', NULL, 'Panel Jury Chair', '$2a$11$UA82Z9eu1cqU1UsOxEbJi.2e1GVHumnSCE9b7kR4gockgBOwHWuYi', 'PANEL_CHAIR', 1, 0, NOW())
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
