import { PrismaClient } from '@prisma/client';

export const retrieveObjectFrequency = (
  prisma: PrismaClient, collectionId: string
): Promise<Map<string, number>> => prisma.comparisonElement.groupBy({
  _count: { objectId: true },
  by: ['objectId'],
  orderBy: { _count: { objectId: 'asc' } },
  where: { comparison: { collectionId } },
}).then((rows) => {
  const result = new Map<string, number>();
  rows.forEach((row) => {
    result.set(row.objectId, row._count.objectId);
  });
  return result;
});
