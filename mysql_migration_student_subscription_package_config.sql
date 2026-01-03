-- MySQL query to create student_subscription_package_config table
-- This table configures which subscription packages are available for each student

CREATE TABLE IF NOT EXISTS `student_subscription_package_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `studentId` INT NOT NULL,
  `packageId` INT NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_subscription_package_config_studentId_packageId_key` (`studentId`, `packageId`),
  INDEX `student_subscription_package_config_studentId_idx` (`studentId`),
  INDEX `student_subscription_package_config_packageId_idx` (`packageId`),
  INDEX `student_subscription_package_config_isActive_idx` (`isActive`),
  CONSTRAINT `student_subscription_package_config_studentId_fkey` 
    FOREIGN KEY (`studentId`) 
    REFERENCES `wpos_wpdatatable_23` (`wdt_ID`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `student_subscription_package_config_packageId_fkey` 
    FOREIGN KEY (`packageId`) 
    REFERENCES `subscription_packages` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;















































