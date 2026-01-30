-- CreateTable
CREATE TABLE `schools` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(32) NULL,
    `address` TEXT NULL,
    `logoUrl` VARCHAR(500) NULL,
    `primaryColor` VARCHAR(7) NULL,
    `secondaryColor` VARCHAR(7) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'trial',
    `statusReason` TEXT NULL,
    `statusChangedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statusChangedById` VARCHAR(191) NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa',
    `defaultCurrency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `defaultLanguage` VARCHAR(10) NOT NULL DEFAULT 'en',
    `features` JSON NULL,
    `telegramBotToken` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,

    UNIQUE INDEX `schools_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `super_admins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `username` VARCHAR(120) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'super-admin',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `telegramBotToken` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `super_admins_username_key`(`username`),
    UNIQUE INDEX `super_admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `baseSalaryPerStudent` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pricing_plans_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `features` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `code` VARCHAR(50) NOT NULL,
    `isCore` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `features_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `premium_features` (
    `id` VARCHAR(191) NOT NULL,
    `featureCode` VARCHAR(100) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `requiredPlans` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `premium_features_featureCode_key`(`featureCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_features` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `featureId` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plan_features_planId_featureId_key`(`planId`, `featureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'trial',
    `currentPeriodStart` DATETIME(3) NULL,
    `currentPeriodEnd` DATETIME(3) NULL,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `nextBillingDate` DATETIME(3) NULL,
    `lastBilledAt` DATETIME(3) NULL,
    `activeStudentCount` INTEGER NOT NULL DEFAULT 0,
    `lastCalculatedAt` DATETIME(3) NULL,
    `enabledFeatures` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,

    UNIQUE INDEX `school_subscriptions_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_settings` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'string',
    `category` VARCHAR(50) NULL,

    INDEX `school_settings_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `school_settings_schoolId_key_key`(`schoolId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_payments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `studentCount` INTEGER NOT NULL,
    `baseFee` DECIMAL(10, 2) NOT NULL,
    `perStudentFee` DECIMAL(10, 2) NOT NULL,
    `featureFees` JSON NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `stripeInvoiceId` VARCHAR(255) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `school_payments_schoolId_idx`(`schoolId`),
    INDEX `school_payments_period_idx`(`period`),
    INDEX `school_payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_status_history` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `oldStatus` VARCHAR(191) NULL,
    `newStatus` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `changedById` VARCHAR(191) NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `school_status_history_schoolId_idx`(`schoolId`),
    INDEX `school_status_history_changedAt_idx`(`changedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_teams` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `wpos_teams_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_wpdatatable_24` (
    `ustazid` VARCHAR(255) NOT NULL,
    `ustazname` VARCHAR(120) NULL,
    `phone` VARCHAR(32) NULL,
    `schedule` TEXT NULL,
    `password` VARCHAR(255) NOT NULL,
    `control` VARCHAR(255) NULL,
    `schoolId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ustazid`(`ustazid`),
    INDEX `wpos_wpdatatable_24_control_fkey`(`control`),
    INDEX `idx_teachers_school_id`(`schoolId`),
    PRIMARY KEY (`ustazid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_wpdatatable_23` (
    `wdt_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `phoneno` VARCHAR(32) NULL,
    `classfee` FLOAT NULL,
    `classfeeCurrency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `startdate` DATETIME(0) NULL,
    `status` VARCHAR(255) NULL,
    `ustaz` VARCHAR(255) NULL,
    `package` VARCHAR(255) NULL,
    `subject` VARCHAR(255) NULL,
    `country` VARCHAR(255) NULL,
    `rigistral` VARCHAR(255) NULL,
    `schoolId` VARCHAR(191) NULL,
    `youtubeSubject` VARCHAR(191) NULL,
    `daypackages` VARCHAR(255) NULL,
    `refer` VARCHAR(255) NULL,
    `registrationdate` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isTrained` BOOLEAN NULL DEFAULT false,
    `chat_id` VARCHAR(64) NULL,
    `progress` VARCHAR(64) NULL,
    `u_control` VARCHAR(255) NULL,
    `exitdate` DATETIME(0) NULL,
    `isKid` BOOLEAN NULL DEFAULT false,
    `reason` VARCHAR(255) NULL,
    `userId` VARCHAR(191) NULL,
    `parent_phone` VARCHAR(20) NULL,
    `stripeCustomerId` VARCHAR(255) NULL,
    `subscriptionPackageConfigId` INTEGER NULL,

    UNIQUE INDEX `wpos_wpdatatable_23_userId_key`(`userId`),
    INDEX `idx_ustaz`(`ustaz`),
    INDEX `wpos_wpdatatable_23_u_control_fkey`(`u_control`),
    INDEX `idx_parent_phone`(`parent_phone`),
    INDEX `idx_students_school_id`(`schoolId`),
    PRIMARY KEY (`wdt_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_wpdatatable_28` (
    `wdt_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `username` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `code` VARCHAR(255) NULL,
    `schoolId` VARCHAR(191) NULL,

    UNIQUE INDEX `wpos_wpdatatable_28_name_key`(`name`),
    UNIQUE INDEX `wpos_wpdatatable_28_username_key`(`username`),
    UNIQUE INDEX `wpos_wpdatatable_28_code_key`(`code`),
    INDEX `idx_controllers_school_id`(`schoolId`),
    PRIMARY KEY (`wdt_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_ustaz_occupied_times` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ustaz_id` VARCHAR(255) NOT NULL,
    `time_slot` VARCHAR(255) NOT NULL,
    `daypackage` VARCHAR(255) NOT NULL,
    `student_id` INTEGER NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `occupied_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_at` DATETIME(3) NULL,

    INDEX `idx_student`(`student_id`),
    INDEX `idx_occupied_times_occupied_at`(`occupied_at`),
    UNIQUE INDEX `wpos_ustaz_occupied_times_ustaz_id_time_slot_daypackage_key`(`ustaz_id`, `time_slot`, `daypackage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_change_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `old_teacher_id` VARCHAR(255) NULL,
    `new_teacher_id` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `change_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `change_reason` VARCHAR(500) NULL,
    `time_slot` VARCHAR(255) NOT NULL,
    `daypackage` VARCHAR(255) NOT NULL,
    `student_package` VARCHAR(255) NULL,
    `monthly_rate` DECIMAL(10, 2) NULL,
    `daily_rate` DECIMAL(10, 2) NULL,
    `created_by` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_teacher_change_student`(`student_id`),
    INDEX `idx_teacher_change_old_teacher`(`old_teacher_id`),
    INDEX `idx_teacher_change_new_teacher`(`new_teacher_id`),
    INDEX `idx_teacher_change_date`(`change_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_wpdatatable_33` (
    `wdt_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NULL,
    `username` VARCHAR(120) NULL,
    `password` VARCHAR(120) NULL,
    `schoolId` VARCHAR(191) NULL,

    UNIQUE INDEX `wpos_wpdatatable_33_name_key`(`name`),
    UNIQUE INDEX `wpos_wpdatatable_33_username_key`(`username`),
    INDEX `idx_registrals_school_id`(`schoolId`),
    PRIMARY KEY (`wdt_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `username` VARCHAR(120) NULL,
    `passcode` VARCHAR(120) NOT NULL,
    `phoneno` VARCHAR(32) NULL,
    `role` VARCHAR(20) NULL DEFAULT 'admin',
    `schoolId` VARCHAR(191) NULL,
    `chat_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_name_key`(`name`),
    UNIQUE INDEX `admin_username_key`(`username`),
    UNIQUE INDEX `admin_chat_id_key`(`chat_id`),
    INDEX `idx_admins_school_id`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SuperAdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `superAdminId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `resourceType` VARCHAR(50) NOT NULL,
    `resourceId` VARCHAR(100) NOT NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_superadmin_audit_superadmin_id`(`superAdminId`),
    INDEX `idx_superadmin_audit_resource_type`(`resourceType`),
    INDEX `idx_superadmin_audit_created_at`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `months_table` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentid` INTEGER NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `month` CHAR(7) NULL,
    `paid_amount` INTEGER NOT NULL,
    `payment_status` VARCHAR(50) NOT NULL,
    `end_date` DATETIME(0) NULL,
    `payment_type` VARCHAR(20) NULL DEFAULT 'full',
    `start_date` DATETIME(0) NULL,
    `free_month_reason` VARCHAR(100) NULL,
    `is_free_month` BOOLEAN NULL DEFAULT false,
    `paymentId` INTEGER NULL,
    `source` ENUM('manual', 'chapa', 'stripe') NOT NULL DEFAULT 'manual',
    `providerReference` VARCHAR(255) NULL,
    `providerStatus` VARCHAR(50) NULL,
    `providerPayload` JSON NULL,

    INDEX `months_table_studentid_idx`(`studentid`),
    INDEX `months_table_schoolId_idx`(`schoolId`),
    INDEX `months_table_paymentId_idx`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_attendance_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `attendance_status` VARCHAR(255) NOT NULL,
    `surah` VARCHAR(255) NULL,
    `pages_read` INTEGER NULL,
    `level` VARCHAR(255) NULL,
    `lesson` VARCHAR(255) NULL,
    `notes` TEXT NULL,

    INDEX `idx_student_attendance_progress`(`student_id`),
    INDEX `student_attendance_progress_schoolId_idx`(`schoolId`),
    INDEX `idx_date`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_zoom_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentid` INTEGER NOT NULL,
    `ustazid` VARCHAR(255) NULL,
    `link` VARCHAR(255) NOT NULL,
    `tracking_token` VARCHAR(32) NOT NULL,
    `clicked_at` DATETIME(0) NULL,
    `sent_time` DATETIME(0) NULL,
    `report` INTEGER NULL DEFAULT 0,
    `expiration_date` DATETIME(0) NULL,
    `packageId` VARCHAR(191) NULL,
    `packageRate` DECIMAL(10, 2) NULL,
    `session_ended_at` DATETIME(0) NULL,
    `session_duration_minutes` INTEGER NULL,
    `session_status` ENUM('active', 'ended', 'timeout') NOT NULL DEFAULT 'active',
    `last_activity_at` DATETIME(0) NULL,
    `zoom_meeting_id` VARCHAR(255) NULL,
    `zoom_start_time` DATETIME(0) NULL,
    `zoom_actual_duration` INTEGER NULL,
    `created_via_api` BOOLEAN NULL DEFAULT false,
    `start_url` VARCHAR(500) NULL,
    `scheduled_start_time` DATETIME(0) NULL,
    `host_joined_at` DATETIME(0) NULL,
    `host_left_at` DATETIME(0) NULL,
    `student_joined_at` DATETIME(0) NULL,
    `student_left_at` DATETIME(0) NULL,
    `teacher_duration_minutes` INTEGER NULL,
    `student_duration_minutes` INTEGER NULL,
    `participant_count` INTEGER NULL DEFAULT 0,
    `recording_started` BOOLEAN NULL DEFAULT false,
    `screen_share_started` BOOLEAN NULL DEFAULT false,
    `meeting_topic` VARCHAR(255) NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `idx_studentid`(`studentid`),
    INDEX `idx_ustazid`(`ustazid`),
    INDEX `wpos_zoom_links_schoolId_idx`(`schoolId`),
    INDEX `idx_sent_time`(`sent_time`),
    INDEX `idx_session_status`(`session_status`),
    INDEX `idx_last_activity`(`last_activity_at`),
    INDEX `idx_zoom_meeting_id`(`zoom_meeting_id`),
    INDEX `idx_scheduled_start_time`(`scheduled_start_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passingResult` INTEGER NOT NULL,
    `lastSubject` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `test_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AbsenceRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classDate` DATETIME(3) NOT NULL,
    `timeSlots` VARCHAR(191) NULL,
    `permitted` BOOLEAN NOT NULL,
    `permissionRequestId` INTEGER NULL,
    `deductionApplied` DOUBLE NOT NULL,
    `reviewedByManager` BOOLEAN NOT NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `AbsenceRecord_admin_fkey`(`adminId`),
    INDEX `AbsenceRecord_permissionRequestId_fkey`(`permissionRequestId`),
    INDEX `AbsenceRecord_teacherId_fkey`(`teacherId`),
    INDEX `AbsenceRecord_schoolId_idx`(`schoolId`),
    INDEX `AbsenceRecord_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceSubmissionLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classDate` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL,
    `isLate` BOOLEAN NOT NULL,
    `deductionApplied` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `AttendanceSubmissionLog_admin_fkey`(`adminId`),
    INDEX `AttendanceSubmissionLog_schoolId_idx`(`schoolId`),
    INDEX `AttendanceSubmissionLog_teacherId_fkey`(`teacherId`),
    INDEX `AttendanceSubmissionLog_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actionType` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `targetId` INTEGER NULL,
    `details` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `AuditLog_admin_fkey`(`adminId`),
    INDEX `AuditLog_schoolId_idx`(`schoolId`),
    INDEX `AuditLog_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BonusRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `BonusRecord_admin_fkey`(`adminId`),
    INDEX `BonusRecord_teacherId_fkey`(`teacherId`),
    INDEX `BonusRecord_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `controllerEarning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `controllerUsername` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `paymentId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paidOut` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ControllerEarningsConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mainBaseRate` DOUBLE NOT NULL DEFAULT 40,
    `referralBaseRate` DOUBLE NOT NULL DEFAULT 40,
    `leavePenaltyMultiplier` DOUBLE NOT NULL DEFAULT 3,
    `leaveThreshold` INTEGER NOT NULL DEFAULT 5,
    `unpaidPenaltyMultiplier` DOUBLE NOT NULL DEFAULT 2,
    `referralBonusMultiplier` DOUBLE NOT NULL DEFAULT 4,
    `targetEarnings` DOUBLE NOT NULL DEFAULT 3000,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `ControllerEarningsConfig_admin_fkey`(`adminId`),
    INDEX `ControllerEarningsConfig_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeductionBonusConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configType` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `effectiveMonths` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `DeductionBonusConfig_admin_fkey`(`adminId`),
    INDEX `DeductionBonusConfig_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LatenessDeductionConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `excusedThreshold` INTEGER NOT NULL,
    `tier` INTEGER NOT NULL,
    `startMinute` INTEGER NOT NULL,
    `endMinute` INTEGER NOT NULL,
    `deductionPercent` DOUBLE NOT NULL,
    `isGlobal` BOOLEAN NOT NULL DEFAULT true,
    `teacherId` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `LatenessDeductionConfig_admin_fkey`(`adminId`),
    INDEX `LatenessDeductionConfig_teacherId_fkey`(`teacherId`),
    INDEX `LatenessDeductionConfig_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LatenessRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classDate` DATETIME(3) NOT NULL,
    `scheduledTime` DATETIME(3) NOT NULL,
    `actualStartTime` DATETIME(3) NOT NULL,
    `latenessMinutes` INTEGER NOT NULL,
    `deductionApplied` DOUBLE NOT NULL,
    `deductionTier` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `LatenessRecord_admin_fkey`(`adminId`),
    INDEX `LatenessRecord_teacherId_fkey`(`teacherId`),
    INDEX `LatenessRecord_schoolId_idx`(`schoolId`),
    INDEX `LatenessRecord_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(255) NOT NULL,
    `userRole` VARCHAR(50) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `Notification_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wpos_wpdatatable_29` (
    `wdt_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `studentid` INTEGER NOT NULL,
    `studentname` VARCHAR(255) NOT NULL,
    `paymentdate` DATETIME(0) NOT NULL,
    `transactionid` VARCHAR(255) NOT NULL,
    `paidamount` DECIMAL(10, 0) NOT NULL,
    `reason` VARCHAR(2000) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `source` ENUM('manual', 'chapa', 'stripe') NOT NULL DEFAULT 'manual',
    `intent` ENUM('tuition', 'deposit', 'subscription') NOT NULL DEFAULT 'tuition',
    `providerReference` VARCHAR(255) NULL,
    `providerStatus` VARCHAR(50) NULL,
    `providerFee` DECIMAL(10, 2) NULL,
    `providerPayload` JSON NULL,
    `subscriptionId` INTEGER NULL,
    `taxAmount` DECIMAL(10, 2) NULL,
    `taxBreakdown` JSON NULL,
    `schoolId` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`wdt_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_checkout` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `txRef` VARCHAR(255) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `provider` ENUM('manual', 'chapa', 'stripe') NOT NULL,
    `intent` ENUM('tuition', 'deposit', 'subscription') NOT NULL DEFAULT 'tuition',
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'initialized',
    `months` JSON NULL,
    `checkoutUrl` VARCHAR(500) NULL,
    `returnUrl` VARCHAR(500) NULL,
    `callbackUrl` VARCHAR(500) NULL,
    `paymentId` INTEGER NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_checkout_txRef_key`(`txRef`),
    INDEX `payment_checkout_studentId_idx`(`studentId`),
    INDEX `payment_checkout_provider_idx`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PermissionReason` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PermissionRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(191) NOT NULL,
    `requestedDate` VARCHAR(191) NOT NULL,
    `timeSlots` VARCHAR(191) NOT NULL,
    `reasonCategory` VARCHAR(191) NOT NULL,
    `reasonDetails` VARCHAR(191) NOT NULL,
    `supportingDocs` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `lateReviewReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,
    `schoolId` VARCHAR(255) NOT NULL,

    INDEX `PermissionRequest_admin_fkey`(`adminId`),
    INDEX `PermissionRequest_teacherId_fkey`(`teacherId`),
    INDEX `PermissionRequest_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    INDEX `PermissionRequest_schoolId_fkey`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QualityAssessment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `weekStart` DATETIME(3) NOT NULL,
    `supervisorFeedback` TEXT NOT NULL,
    `examinerRating` DOUBLE NULL,
    `studentPassRate` DOUBLE NULL,
    `overallQuality` VARCHAR(191) NOT NULL,
    `managerApproved` BOOLEAN NOT NULL,
    `managerOverride` BOOLEAN NOT NULL,
    `overrideNotes` VARCHAR(191) NULL,
    `bonusAwarded` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `QualityAssessment_admin_fkey`(`adminId`),
    INDEX `QualityAssessment_teacherId_fkey`(`teacherId`),
    INDEX `QualityAssessment_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    INDEX `idx_quality_assessment_school_id`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QualityDescription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `QualityDescription_admin_fkey`(`adminId`),
    INDEX `QualityDescription_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(64) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `value` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `setting_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `Setting_key_schoolId_key`(`key`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registralearningsconfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `schoolId` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `registralearningsconfig_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherSalaryPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(255) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `adminId` VARCHAR(191) NULL,
    `totalSalary` DOUBLE NOT NULL,
    `latenessDeduction` DOUBLE NOT NULL,
    `absenceDeduction` DOUBLE NOT NULL,
    `bonuses` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `wpos_wpdatatable_28Wdt_ID` INTEGER NULL,

    INDEX `TeacherSalaryPayment_admin_fkey`(`adminId`),
    INDEX `TeacherSalaryPayment_teacherId_period_idx`(`teacherId`, `period`),
    INDEX `TeacherSalaryPayment_wpos_wpdatatable_28Wdt_ID_fkey`(`wpos_wpdatatable_28Wdt_ID`),
    UNIQUE INDEX `TeacherSalaryPayment_teacherId_period_schoolId_key`(`teacherId`, `period`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testAppointment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,

    INDEX `testAppointment_testId_fkey`(`testId`),
    UNIQUE INDEX `testAppointment_studentId_testId_key`(`studentId`, `testId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `odd` INTEGER NOT NULL,

    INDEX `testQuestion_testId_fkey`(`testId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testResult` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `result` INTEGER NOT NULL,

    INDEX `testResult_questionId_idx`(`questionId`),
    INDEX `testResult_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackageSalary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `packageName` VARCHAR(191) NOT NULL,
    `salaryPerStudent` DECIMAL(10, 2) NOT NULL,
    `durationDays` INTEGER NOT NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PackageSalary_packageName_key`(`packageName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentStatus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentStatus_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `StudentStatus_name_schoolId_key`(`name`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentPackage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentPackage_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `StudentPackage_name_schoolId_key`(`name`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentSubject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentSubject_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `StudentSubject_name_schoolId_key`(`name`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackageDeduction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `packageName` VARCHAR(191) NOT NULL,
    `latenessBaseAmount` DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
    `absenceBaseAmount` DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PackageDeduction_packageName_key`(`packageName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('manager', 'teacher', 'student') NOT NULL,
    `firstName` VARCHAR(191) NOT NULL DEFAULT '',
    `lastName` VARCHAR(191) NOT NULL DEFAULT '',
    `phoneNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentdaypackage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `studentdaypackage_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `studentdaypackage_name_schoolId_key`(`name`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deduction_waivers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` VARCHAR(255) NOT NULL,
    `deductionType` VARCHAR(50) NOT NULL,
    `deductionDate` DATE NOT NULL,
    `originalAmount` DECIMAL(10, 2) NOT NULL,
    `reason` TEXT NOT NULL,
    `adminId` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_teacher_date`(`teacherId`, `deductionDate`),
    INDEX `idx_type_date`(`deductionType`, `deductionDate`),
    INDEX `idx_admin`(`adminId`),
    UNIQUE INDEX `deduction_waivers_teacherId_deductionType_deductionDate_key`(`teacherId`, `deductionType`, `deductionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacherRating` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(255) NOT NULL,
    `rating` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_calculation_cache` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `calculationData` JSON NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `salary_calculation_cache_teacherId_idx`(`teacherId`),
    INDEX `salary_calculation_cache_schoolId_idx`(`schoolId`),
    INDEX `salary_calculation_cache_period_idx`(`period`),
    INDEX `salary_calculation_cache_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `salary_calculation_cache_teacherId_period_schoolId_key`(`teacherId`, `period`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `transactionId` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_transactions_transactionId_key`(`transactionId`),
    INDEX `payment_transactions_teacherId_idx`(`teacherId`),
    INDEX `payment_transactions_schoolId_idx`(`schoolId`),
    INDEX `payment_transactions_period_idx`(`period`),
    INDEX `payment_transactions_status_idx`(`status`),
    INDEX `payment_transactions_processedAt_idx`(`processedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_adjustments` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `adjustmentType` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reason` TEXT NOT NULL,
    `adminId` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `salary_adjustments_teacherId_idx`(`teacherId`),
    INDEX `salary_adjustments_schoolId_idx`(`schoolId`),
    INDEX `salary_adjustments_period_idx`(`period`),
    INDEX `salary_adjustments_adjustmentType_idx`(`adjustmentType`),
    INDEX `salary_adjustments_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_reports` (
    `id` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(20) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `format` VARCHAR(10) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `filePath` VARCHAR(500) NULL,
    `generatedAt` DATETIME(3) NULL,
    `adminId` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `salary_reports_reportType_idx`(`reportType`),
    INDEX `salary_reports_schoolId_idx`(`schoolId`),
    INDEX `salary_reports_period_idx`(`period`),
    INDEX `salary_reports_status_idx`(`status`),
    INDEX `salary_reports_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,
    `paymentLink` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `configId` INTEGER NULL,
    `taxCode` VARCHAR(50) NULL,
    `taxInclusive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `subscription_packages_isActive_idx`(`isActive`),
    INDEX `subscription_packages_schoolId_idx`(`schoolId`),
    INDEX `subscription_packages_configId_idx`(`configId`),
    INDEX `subscription_packages_taxCode_idx`(`taxCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `packageId` INTEGER NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `stripeSubscriptionId` VARCHAR(255) NOT NULL,
    `stripeCustomerId` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `nextBillingDate` DATETIME(3) NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `billingAddress` JSON NULL,
    `taxEnabled` BOOLEAN NOT NULL DEFAULT false,
    `totalTaxPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_subscriptions_stripeSubscriptionId_key`(`stripeSubscriptionId`),
    INDEX `student_subscriptions_studentId_idx`(`studentId`),
    INDEX `student_subscriptions_schoolId_idx`(`schoolId`),
    INDEX `student_subscriptions_stripeSubscriptionId_idx`(`stripeSubscriptionId`),
    INDEX `student_subscriptions_status_idx`(`status`),
    INDEX `student_subscriptions_taxEnabled_idx`(`taxEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_package_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `subscription_package_config_isActive_idx`(`isActive`),
    INDEX `subscription_package_config_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` INTEGER NULL,
    `invoiceId` VARCHAR(255) NULL,
    `studentId` INTEGER NULL,
    `packageId` INTEGER NULL,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `baseAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `stripeFee` DECIMAL(10, 2) NULL,
    `taxBreakdown` JSON NULL,
    `billingCountry` VARCHAR(10) NULL,
    `billingState` VARCHAR(100) NULL,
    `billingCity` VARCHAR(100) NULL,
    `billingPostalCode` VARCHAR(20) NULL,
    `billingLine1` VARCHAR(255) NULL,
    `billingLine2` VARCHAR(255) NULL,
    `stripeTaxCalculationId` VARCHAR(255) NULL,
    `stripeCustomerId` VARCHAR(255) NULL,
    `taxStatus` VARCHAR(50) NOT NULL DEFAULT 'calculated',
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tax_transactions_subscriptionId_idx`(`subscriptionId`),
    INDEX `tax_transactions_studentId_idx`(`studentId`),
    INDEX `tax_transactions_invoiceId_idx`(`invoiceId`),
    INDEX `tax_transactions_taxStatus_idx`(`taxStatus`),
    INDEX `tax_transactions_createdAt_idx`(`createdAt`),
    INDEX `tax_transactions_billingCountry_idx`(`billingCountry`),
    INDEX `tax_transactions_billingState_idx`(`billingState`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `schools` ADD CONSTRAINT `schools_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schools` ADD CONSTRAINT `schools_statusChangedById_fkey` FOREIGN KEY (`statusChangedById`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricing_plans` ADD CONSTRAINT `pricing_plans_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `premium_features` ADD CONSTRAINT `premium_features_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `super_admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_features` ADD CONSTRAINT `plan_features_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `pricing_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_features` ADD CONSTRAINT `plan_features_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `features`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_subscriptions` ADD CONSTRAINT `school_subscriptions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_subscriptions` ADD CONSTRAINT `school_subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `pricing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_settings` ADD CONSTRAINT `school_settings_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_payments` ADD CONSTRAINT `school_payments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_status_history` ADD CONSTRAINT `school_status_history_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_status_history` ADD CONSTRAINT `school_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `super_admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_teams` ADD CONSTRAINT `wpos_teams_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_24` ADD CONSTRAINT `wpos_wpdatatable_24_control_fkey` FOREIGN KEY (`control`) REFERENCES `wpos_wpdatatable_28`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_24` ADD CONSTRAINT `wpos_wpdatatable_24_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_23` ADD CONSTRAINT `wpos_wpdatatable_23_u_control_fkey` FOREIGN KEY (`u_control`) REFERENCES `wpos_wpdatatable_28`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_23` ADD CONSTRAINT `wpos_wpdatatable_23_ustaz_fkey` FOREIGN KEY (`ustaz`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_23` ADD CONSTRAINT `wpos_wpdatatable_23_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_23` ADD CONSTRAINT `wpos_wpdatatable_23_subscriptionPackageConfigId_fkey` FOREIGN KEY (`subscriptionPackageConfigId`) REFERENCES `subscription_package_config`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_23` ADD CONSTRAINT `wpos_wpdatatable_23_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_28` ADD CONSTRAINT `wpos_wpdatatable_28_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_ustaz_occupied_times` ADD CONSTRAINT `wpos_ustaz_occupied_times_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_ustaz_occupied_times` ADD CONSTRAINT `wpos_ustaz_occupied_times_ustaz_id_fkey` FOREIGN KEY (`ustaz_id`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_change_history` ADD CONSTRAINT `teacher_change_history_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_change_history` ADD CONSTRAINT `teacher_change_history_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_change_history` ADD CONSTRAINT `teacher_change_history_old_teacher_id_fkey` FOREIGN KEY (`old_teacher_id`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_change_history` ADD CONSTRAINT `teacher_change_history_new_teacher_id_fkey` FOREIGN KEY (`new_teacher_id`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_33` ADD CONSTRAINT `wpos_wpdatatable_33_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SuperAdminAuditLog` ADD CONSTRAINT `SuperAdminAuditLog_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `months_table` ADD CONSTRAINT `months_table_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `months_table` ADD CONSTRAINT `month_studentid_fkey` FOREIGN KEY (`studentid`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `months_table` ADD CONSTRAINT `months_table_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `wpos_wpdatatable_29`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance_progress` ADD CONSTRAINT `student_attendance_progress_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance_progress` ADD CONSTRAINT `student_attendance_progress_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_zoom_links` ADD CONSTRAINT `wpos_zoom_links_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_zoom_links` ADD CONSTRAINT `wpos_zoom_links_studentid_fkey` FOREIGN KEY (`studentid`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_zoom_links` ADD CONSTRAINT `wpos_zoom_links_ustazid_fkey` FOREIGN KEY (`ustazid`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsenceRecord` ADD CONSTRAINT `AbsenceRecord_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsenceRecord` ADD CONSTRAINT `AbsenceRecord_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsenceRecord` ADD CONSTRAINT `AbsenceRecord_permissionRequestId_fkey` FOREIGN KEY (`permissionRequestId`) REFERENCES `PermissionRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsenceRecord` ADD CONSTRAINT `AbsenceRecord_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbsenceRecord` ADD CONSTRAINT `AbsenceRecord_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceSubmissionLog` ADD CONSTRAINT `AttendanceSubmissionLog_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceSubmissionLog` ADD CONSTRAINT `AttendanceSubmissionLog_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceSubmissionLog` ADD CONSTRAINT `AttendanceSubmissionLog_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceSubmissionLog` ADD CONSTRAINT `AttendanceSubmissionLog_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusRecord` ADD CONSTRAINT `BonusRecord_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusRecord` ADD CONSTRAINT `BonusRecord_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusRecord` ADD CONSTRAINT `BonusRecord_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonusRecord` ADD CONSTRAINT `BonusRecord_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ControllerEarningsConfig` ADD CONSTRAINT `ControllerEarningsConfig_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ControllerEarningsConfig` ADD CONSTRAINT `ControllerEarningsConfig_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeductionBonusConfig` ADD CONSTRAINT `DeductionBonusConfig_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeductionBonusConfig` ADD CONSTRAINT `DeductionBonusConfig_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessDeductionConfig` ADD CONSTRAINT `LatenessDeductionConfig_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessDeductionConfig` ADD CONSTRAINT `LatenessDeductionConfig_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessDeductionConfig` ADD CONSTRAINT `LatenessDeductionConfig_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessRecord` ADD CONSTRAINT `LatenessRecord_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessRecord` ADD CONSTRAINT `LatenessRecord_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessRecord` ADD CONSTRAINT `LatenessRecord_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatenessRecord` ADD CONSTRAINT `LatenessRecord_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_29` ADD CONSTRAINT `wpos_wpdatatable_29_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_29` ADD CONSTRAINT `Payment_studentid_fkey` FOREIGN KEY (`studentid`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wpos_wpdatatable_29` ADD CONSTRAINT `wpos_wpdatatable_29_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `student_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_checkout` ADD CONSTRAINT `payment_checkout_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_checkout` ADD CONSTRAINT `payment_checkout_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `wpos_wpdatatable_29`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_checkout` ADD CONSTRAINT `payment_checkout_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermissionRequest` ADD CONSTRAINT `PermissionRequest_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermissionRequest` ADD CONSTRAINT `PermissionRequest_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermissionRequest` ADD CONSTRAINT `PermissionRequest_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermissionRequest` ADD CONSTRAINT `PermissionRequest_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityAssessment` ADD CONSTRAINT `QualityAssessment_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityAssessment` ADD CONSTRAINT `QualityAssessment_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityAssessment` ADD CONSTRAINT `QualityAssessment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityAssessment` ADD CONSTRAINT `QualityAssessment_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityDescription` ADD CONSTRAINT `QualityDescription_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityDescription` ADD CONSTRAINT `QualityDescription_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registralearningsconfig` ADD CONSTRAINT `registralearningsconfig_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSalaryPayment` ADD CONSTRAINT `TeacherSalaryPayment_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSalaryPayment` ADD CONSTRAINT `TeacherSalaryPayment_admin_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSalaryPayment` ADD CONSTRAINT `TeacherSalaryPayment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSalaryPayment` ADD CONSTRAINT `TeacherSalaryPayment_wpos_wpdatatable_28Wdt_ID_fkey` FOREIGN KEY (`wpos_wpdatatable_28Wdt_ID`) REFERENCES `wpos_wpdatatable_28`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testAppointment` ADD CONSTRAINT `testAppointment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testAppointment` ADD CONSTRAINT `testAppointment_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testQuestion` ADD CONSTRAINT `testQuestion_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `test`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testResult` ADD CONSTRAINT `testResult_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `testQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testResult` ADD CONSTRAINT `testResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentStatus` ADD CONSTRAINT `StudentStatus_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentPackage` ADD CONSTRAINT `StudentPackage_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentSubject` ADD CONSTRAINT `StudentSubject_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentdaypackage` ADD CONSTRAINT `studentdaypackage_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherRating` ADD CONSTRAINT `teacherRating_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherRating` ADD CONSTRAINT `teacherRating_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `wpos_wpdatatable_24`(`ustazid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_calculation_cache` ADD CONSTRAINT `salary_calculation_cache_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_adjustments` ADD CONSTRAINT `salary_adjustments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_reports` ADD CONSTRAINT `salary_reports_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_packages` ADD CONSTRAINT `subscription_packages_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_packages` ADD CONSTRAINT `subscription_packages_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `subscription_package_config`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `subscription_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_transactions` ADD CONSTRAINT `tax_transactions_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `student_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_transactions` ADD CONSTRAINT `tax_transactions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `wpos_wpdatatable_23`(`wdt_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_transactions` ADD CONSTRAINT `tax_transactions_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `subscription_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
