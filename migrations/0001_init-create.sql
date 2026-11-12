-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,
    "requestTime" DATETIME NOT NULL,
    "requestIp" TEXT NOT NULL,
    CONSTRAINT "Comparison_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("collectionId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "collectionId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "datasource" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cachedData" TEXT NOT NULL,
    "lastUpdateTime" DATETIME NOT NULL,
    "maxElementsPerComparison" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "ComparisonElement" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "elementId" BIGINT NOT NULL,
    "comparisonId" BIGINT NOT NULL,
    "objectId" TEXT NOT NULL,
    CONSTRAINT "ComparisonElement_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComparisonResponse" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "selectedComparisonElementId" BIGINT NOT NULL,
    "comparisonId" BIGINT NOT NULL,
    CONSTRAINT "ComparisonResponse_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session" (
    "session_id" TEXT NOT NULL PRIMARY KEY,
    "sess" JSONB NOT NULL,
    "expire" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "UserLogins" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "loginTime" DATETIME NOT NULL,
    "loginIp" TEXT NOT NULL,
    CONSTRAINT "UserLogins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserLogins_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("session_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "IDX_Comparison_collectionId" ON "Comparison"("collectionId");

-- CreateIndex
CREATE INDEX "IDX_ComparisonElement_comparisonId" ON "ComparisonElement"("comparisonId");

-- CreateIndex
CREATE INDEX "IDX_ComparisonElement_elementId" ON "ComparisonElement"("elementId");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- CreateIndex
CREATE INDEX "IDX_UserLogins_userId" ON "UserLogins"("userId");
