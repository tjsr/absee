import { CollectionObjectId, SnowflakeType } from './types.ts';

import { ComparableObjectModel } from './types/model.ts';
import { PrismaClient } from '@prisma/client';
import { getSnowflake } from './snowflake.ts';
import { storeComparisonElement } from './comparisonelement.ts';

describe('comparisonelement', () => {
  test('Should write an element through Prisma', async (): Promise<void> => {
    const comparisonId: SnowflakeType = getSnowflake();
    const meta: ComparableObjectModel<CollectionObjectId> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1' as CollectionObjectId,
    };
    const prisma = {
      comparisonElement: { create: async ({ data }: {data: ComparableObjectModel<CollectionObjectId>}) => data },
    } as unknown as PrismaClient;

    await expect(storeComparisonElement(prisma, comparisonId, meta)).resolves.toMatchObject({
      comparisonId,
      elementId: meta.elementId,
      id: meta.id,
      objectId: meta.objectId,
    });
  });
});
