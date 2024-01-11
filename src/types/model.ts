import {
  CollectionIdType,
  EmailAddress,
  IPAddress,
  ISO8601Date,
  SnowflakeType,
  UserId
} from '../types';

export type ComparableObjectModel = {
  id: SnowflakeType;
  elementId: SnowflakeType;
  objectId: string;
};

export type ComparisonModel = {
  id: SnowflakeType;
  collectionId: CollectionIdType;
  a: ComparableObjectModel[];
  b: ComparableObjectModel[];
  requestIp: IPAddress;
  requestTime: ISO8601Date;
  userId: UserId;
};

export type UserModel = {
  userId: UserId;
  email: EmailAddress;
};
