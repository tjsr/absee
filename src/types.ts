export type ConfigType = {
  port: number,
}

export type uuid = string;

export type ComparisonSelection = {
  id: uuid
  a: ComparableObjectMetadata;
  b: ComparableObjectMetadata;
  userId: uuid,
  requestTime: ISO8601Date;
};

export type ComparisonRequestPutBody = {
  id: uuid
  a: uuid;
  b: uuid;
  userId: uuid,
  requestTime: ISO8601Date;
};

export type ISO8601Date = string;

export type UserId = uuid;

export type ComparableObjectMetadata = {
  id: uuid,
};
