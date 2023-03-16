export type uuid = string;

export type SnowflakeType = string;

export type IPAddress = string;

export type ComparisonRequestPutBody = {
  id: SnowflakeType
  userId: uuid,
  requestTime: ISO8601Date;
  requestIp: IPAddress;
};

export type ISO8601Date = string;

export type UserId = uuid;

export type ComparableObjectPutBody = {
  id: SnowflakeType,
  comparisonId: SnowflakeType,
  elementId: SnowflakeType,
  objectId: string,
};

// export type PinInfo = {
//   id: string,
//   img?: string,
// };

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

