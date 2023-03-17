/*
  Warnings:

  - Added the required column `requestIp` to the `Comparison` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestTime" TEXT NOT NULL,
    "requestIp" TEXT NOT NULL
);
INSERT INTO "new_Comparison" ("id", "requestTime", "userId") SELECT "id", "requestTime", "userId" FROM "Comparison";
DROP TABLE "Comparison";
ALTER TABLE "new_Comparison" RENAME TO "Comparison";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
