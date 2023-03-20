import { ISO8601Date, SnowflakeType } from './types/mysqltypes';

export type uuid = string;
export type IPAddress = string;

export type ComparisonRequestPutBody = {
  id: SnowflakeType;
  collectionId: CollectionIdType;
  userId: uuid;
  requestTime: ISO8601Date;
  requestIp: IPAddress;
};

export type UserId = uuid;

export type EmailAddress = string;
export type CookieName = string;
export type CollectionIdType = uuid;

export type ComparableObjectPutBody = {
  id: SnowflakeType;
  comparisonId: SnowflakeType;
  elementId: SnowflakeType;
  objectId: string;
};

export type ComparableObjectResponse<T> = {
  elementId: SnowflakeType;
  objects: string[];
  data: T[];
};

export type ComparisonSelectionResponse<T> = {
  id: SnowflakeType;
  userId: UserId;
  a: ComparableObjectResponse<T>;
  b: ComparableObjectResponse<T>;
};

export type { ISO8601Date, SnowflakeType };
