import { CollectionIdType, IPAddress, SnowflakeType, UserId } from "./types";
import { ComparableObjectModel, ComparisonModel } from "./types/model";

import { iso8601Now } from "./utils";

export const createComparisonSelection = <T>(collectionId: CollectionIdType, comparisonId: SnowflakeType, userId: UserId, ipAddress: IPAddress, left: ComparableObjectModel<T>[], right: ComparableObjectModel<T>[]): ComparisonModel<T> => {
  return {
    id: comparisonId,
    collectionId: collectionId,
    userId,
    requestTime: iso8601Now(),
    requestIp: ipAddress,
    a: left,
    b: right,
  }
};
