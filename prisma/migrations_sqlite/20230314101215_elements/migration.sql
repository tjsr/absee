/*
  Warnings:

  - You are about to drop the column `a` on the `Comparison` table. All the data in the column will be lost.
  - You are about to drop the column `b` on the `Comparison` table. All the data in the column will be lost.
  - You are about to drop the column `selectedResponse` on the `ComparisonResponse` table. All the data in the column will be lost.
  - Added the required column `selectedComparisonElementId` to the `ComparisonResponse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ComparisonElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elementId" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestTime" TEXT NOT NULL
);
INSERT INTO "new_Comparison" ("id", "requestTime", "userId") SELECT "id", "requestTime", "userId" FROM "Comparison";
DROP TABLE "Comparison";
ALTER TABLE "new_Comparison" RENAME TO "Comparison";
CREATE TABLE "new_ComparisonResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selectedComparisonElementId" TEXT NOT NULL
);
INSERT INTO "new_ComparisonResponse" ("id") SELECT "id" FROM "ComparisonResponse";
DROP TABLE "ComparisonResponse";
ALTER TABLE "new_ComparisonResponse" RENAME TO "ComparisonResponse";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
