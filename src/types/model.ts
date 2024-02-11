import {
  CollectionIdType,
  CollectionObjectId,
  EmailAddress,
  IPAddress,
  ISO8601Date,
  SnowflakeType,
  UserId
} from '../types.js';

export type ComparableObjectModel<CollectionObjectIdType extends CollectionObjectId> = {
  id: SnowflakeType;
  elementId: SnowflakeType;
  objectId: CollectionObjectIdType;
};

export type ComparisonModel<CollectionObjectIdType extends CollectionObjectId> = {
  id: SnowflakeType;
  collectionId: CollectionIdType;
  a: ComparableObjectModel<CollectionObjectIdType>[];
  b: ComparableObjectModel<CollectionObjectIdType>[];
  requestIp: IPAddress;
  requestTime: ISO8601Date;
  userId: UserId;
};

export type UserModel = {
  userId: UserId;
  email: EmailAddress;
};
