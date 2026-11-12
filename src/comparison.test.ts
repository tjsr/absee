import { CollectionObjectId, SnowflakeType } from './types.ts';
import { ComparableObjectModel, ComparisonModel } from './types/model.ts';

import { PrismaClient } from '@prisma/client';
import { getSnowflake } from './snowflake.ts';
import { storeComparisonRequest } from './comparison.ts';
import { v4 as uuidv4 } from 'uuid';

describe('comparison', () => {
  test('Should write a comparison request and its elements through Prisma', async () => {
    const comparisonId: SnowflakeType = getSnowflake();
    const metaa: ComparableObjectModel<CollectionObjectId> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1',
    };
    const metab: ComparableObjectModel<CollectionObjectId> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '2',
    };
    const comparisonRequest: ComparisonModel<CollectionObjectId> = {
      a: [metaa],
      b: [metab],
      collectionId: uuidv4(),
      id: comparisonId,
      requestIp: '127.0.0.1',
      requestTime: new Date(),
      userId: uuidv4(),
    };
    const prisma = {
      comparison: { create: async () => ({}) },
      comparisonElement: { create: async () => ({}) },
    } as unknown as PrismaClient;

    await expect(storeComparisonRequest(prisma, comparisonRequest)).resolves.toHaveLength(2);
  });
});
