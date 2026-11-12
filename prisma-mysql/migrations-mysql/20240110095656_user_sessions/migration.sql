-- CreateTable
CREATE TABLE `UserLogins` (
    `id` BIGINT NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(128) NOT NULL,
    `loginTime` DATETIME(3) NOT NULL,
    `loginIp` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
