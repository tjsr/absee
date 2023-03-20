import { CollectionIdType, IPAddress, SnowflakeType, UserId } from './types';
import { ComparableObjectModel, ComparisonModel } from './types/model';

import { iso8601Now } from './utils';

export const createComparisonSelection = <T>(
  collectionId: CollectionIdType,
  comparisonId: SnowflakeType,
  userId: UserId,
  ipAddress: IPAddress,
  left: ComparableObjectModel[],
  right: ComparableObjectModel[]
): ComparisonModel => {
  return {
    a: left,
    b: right,
    collectionId: collectionId,
    id: comparisonId,
    requestIp: ipAddress,
    requestTime: iso8601Now(),
    userId,
  };
};
