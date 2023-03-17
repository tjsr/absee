-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestTime" TEXT NOT NULL,
    "a" TEXT NOT NULL,
    "b" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComparisonResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selectedResponse" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
