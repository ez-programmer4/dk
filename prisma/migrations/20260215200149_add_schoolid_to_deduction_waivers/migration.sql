-- AlterTable
ALTER TABLE `deduction_waivers` ADD COLUMN `schoolId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `deduction_waivers` ADD CONSTRAINT `deduction_waivers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
