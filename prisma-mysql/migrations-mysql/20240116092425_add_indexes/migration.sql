-- CreateIndex
CREATE INDEX `IDX_Comparison_collectionId` ON `Comparison`(`collectionId`);

-- CreateIndex
CREATE INDEX `IDX_ComparisonElement_comparisonId` ON `ComparisonElement`(`comparisonId`);

-- CreateIndex
CREATE INDEX `IDX_ComparisonElement_elementId` ON `ComparisonElement`(`elementId`);

-- CreateIndex
CREATE INDEX `IDX_UserLogins_userId` ON `UserLogins`(`userId`);
