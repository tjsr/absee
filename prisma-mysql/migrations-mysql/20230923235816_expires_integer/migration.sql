/*
  Warnings:

  - Changed the type of `expire` on the `session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE `session`
    ADD COLUMN `expire_temp` INTEGER UNSIGNED NOT NULL;

UPDATE `session` SET expire_temp = UNIX_TIMESTAMP(expire)*1000;

ALTER TABLE `session` DROP COLUMN `expire`;
ALTER TABLE `session` CHANGE COLUMN `expire_temp` `expire` INTEGER UNSIGNED NOT NULL;

