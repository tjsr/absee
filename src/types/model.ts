import {
  CollectionIdType,
  EmailAddress,
  IPAddress,
  ISO8601Date,
  SnowflakeType,
  uuid4,
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
  userId: uuid4;
};

export type UserModel = {
  userId: uuid4;
  email: EmailAddress;
};
