import { CollectionObjectId, ComparableObjectPutBody, ComparisonElement, SnowflakeType } from './types.ts';

import { ComparableObjectModel } from './types/model.ts';
import { PrismaClient } from '@prisma/client';

export const storeComparisonElement = async <IdType extends CollectionObjectId>(
  prisma: PrismaClient,
  comparisonId: SnowflakeType,
  comparisonElement: ComparableObjectModel<IdType>
): Promise<ComparisonElement> => {
  const postRequest: ComparableObjectPutBody = {
    comparisonId: comparisonId,
    elementId: comparisonElement.elementId,
    id: comparisonElement.id,
    objectId: comparisonElement.objectId,
  };
  return prisma.comparisonElement.create({
    data: {
      comparisonId: BigInt(postRequest.comparisonId),
      elementId: BigInt(postRequest.elementId),
      id: BigInt(postRequest.id),
      objectId: postRequest.objectId,
    },
  });
};

export const storeComparisonElements = <IdType extends CollectionObjectId>(
  prisma: PrismaClient,
  comparisonId: SnowflakeType,
  comparisonElements: ComparableObjectModel<IdType>[]
): Promise<unknown>[] => {
  const storagePromises: Promise<unknown>[] = [];

  comparisonElements.forEach((element) => {
    storagePromises.push(storeComparisonElement(prisma, comparisonId, element));
  });
  return storagePromises;
};
