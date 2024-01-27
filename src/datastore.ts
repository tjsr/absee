import { CollectionIdType, IPAddress, SnowflakeType, UserId } from './types.js';
import { ComparableObjectModel, ComparisonModel } from './types/model.js';

import { iso8601Now } from './utils.js';

export const createComparisonSelection = (
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
