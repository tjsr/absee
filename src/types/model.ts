import { IPAddress, ISO8601Date, SnowflakeType, uuid } from "../types";

export type ComparableObjectModel<T extends any> = {
  id: SnowflakeType,
  elementId: SnowflakeType,
  objectId: string,
  data: T;
};

export type ComparisonModel<T extends any> = {
  id: SnowflakeType
  a: ComparableObjectModel<T>[];
  b: ComparableObjectModel<T>[];
  requestIp: IPAddress;
  requestTime: ISO8601Date;
  userId: uuid,
};

