import { ComparableObjectModel, ComparisonModel } from "./types/model";
import { IPAddress, SnowflakeType, UserId } from "./types";

import { iso8601Now } from "./utils";

export const createComparisonSelection = <T>(comparisonId: SnowflakeType, userId: UserId, ipAddress: IPAddress, left: ComparableObjectModel<T>[], right: ComparableObjectModel<T>[]): ComparisonModel<T> => {
  return {
    id: comparisonId,
    userId,
    requestTime: iso8601Now(),
    requestIp: ipAddress,
    a: left,
    b: right,
  }
};
