export type uuid = string;

export type SnowflakeType = string;

export type IPAddress = string;

export type ComparisonSelection<T extends any> = {
  id: SnowflakeType
  a: ComparableObjectMetadata<T>[];
  b: ComparableObjectMetadata<T>[];
  requestIp: IPAddress;
  requestTime: ISO8601Date;
  userId: uuid,
};

export type ComparisonRequestPutBody = {
  id: SnowflakeType
  userId: uuid,
  requestTime: ISO8601Date;
  requestIp: IPAddress;
};

export type ISO8601Date = string;

export type UserId = uuid;

export type ComparableObjectMetadata<T extends any> = {
  id: SnowflakeType,
  elementId: SnowflakeType,
  objectId: string,
  data: T;
};

export type ComparableObjectPutBody = {
  id: SnowflakeType,
  comparisonId: SnowflakeType,
  elementId: SnowflakeType,
  objectId: string,
};

export type PinInfo = {
  id: string,
  img?: string,
};
