-- AlterTable
ALTER TABLE `permissionrequest` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `permissionrequest` ADD CONSTRAINT `PermissionRequest_school_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `PermissionRequest_school_fkey` ON `permissionrequest`(`schoolId`);
