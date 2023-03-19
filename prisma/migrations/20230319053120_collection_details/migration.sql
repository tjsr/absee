-- AlterTable
ALTER TABLE `Comparison` ADD COLUMN `collectionId` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `session` ALTER COLUMN `expire` DROP DEFAULT;

-- CreateTable
CREATE TABLE `Collection` (
    `collectionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `datasource` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `cachedData` VARCHAR(191) NOT NULL,
    `lastUpdateTime` DATETIME(3) NOT NULL,

    PRIMARY KEY (`collectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
