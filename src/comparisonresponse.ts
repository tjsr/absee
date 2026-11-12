import { ComparisonElementId, ComparisonId } from './types.ts';

import { PrismaClient } from '@prisma/client';

export const saveComparisonSelection = (
  prisma: PrismaClient,
  comparisonId: ComparisonId,
  elementId: ComparisonElementId
): Promise<void> => {
  return prisma.comparisonResponse.create({
    data: {
      comparisonId: BigInt(comparisonId),
      id: BigInt(comparisonId),
      selectedComparisonElementId: BigInt(elementId),
    },
  }).then(() => undefined);
};
