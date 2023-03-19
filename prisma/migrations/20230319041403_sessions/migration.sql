-- CreateTable
CREATE TABLE `session` (
    `session_id` VARCHAR(128) NOT NULL,
    `sess` JSON NOT NULL,
    `expire` TIMESTAMP(6) NOT NULL,

    INDEX `IDX_session_expire`(`expire`),
    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
