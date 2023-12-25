import { ISO8601Date, SnowflakeType } from './types/mysqltypes';

export type uuid = string;
export type uuid5 = uuid;
export type uuid4 = uuid;
export type IPAddress = string;

export type ComparisonRequestPutBody = {
  id: SnowflakeType;
  collectionId: CollectionIdType;
  userId: UserId;
  requestTime: ISO8601Date;
  requestIp: IPAddress;
};

export type UserId = uuid5;

export type EmailAddress = string;
export type CookieName = string;
export type CollectionIdType = uuid4;

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
  responseTime?: ISO8601Date;
  userId: UserId;
  a: ComparableObjectResponse<T>;
  b: ComparableObjectResponse<T>;
};

export type ComparisonElement<T> = {
  elementId: SnowflakeType;
  data: T[];
}

export type ComparisonResult<T> = {
  id: SnowflakeType;
  userId: UserId;
  elements: ComparisonElement<T>[];
  // a: ComparisonElement<T>;
  // b: ComparisonElement<T>;
  winner: SnowflakeType;
  requestTime: ISO8601Date;
};

export type { ISO8601Date, SnowflakeType };
