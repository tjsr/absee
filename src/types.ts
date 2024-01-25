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
export type CollectionObjectIdType = any;
export type CollectionObject<CollectionObjectIdType> = {
  id: CollectionObjectIdType
};

// export interface CollectionIdElement<ID> {
//   id: ID;
// }

export type ComparableObjectPutBody = {
  id: SnowflakeType;
  comparisonId: SnowflakeType;
  elementId: SnowflakeType;
  objectId: string;
};

export type ComparableObjectResponse<CollectionObject> = {
  elementId: SnowflakeType;
  objects: string[];
  data: CollectionObject[];
};

export type ComparisonSelectionResponse<CollectionObject> = {
  id: SnowflakeType;
  responseTime: ISO8601Date;
  userId: UserId;
  a: ComparableObjectResponse<CollectionObject>;
  b: ComparableObjectResponse<CollectionObject>;
};

export type ComparisonElementResponse<CollectionObject> = {
  elementId: SnowflakeType;
  data: CollectionObject[];
}

export type ComparisonElement = {
  elementId: SnowflakeType;
  objects: string[];
}

export type ComparisonResult = {
  id: SnowflakeType;
  userId: UserId;
  elements: ComparisonElement[];
  winner: SnowflakeType;
  requestTime: ISO8601Date;
};

export type ComparisonResultResponse<CollectionObject> = {
  id: SnowflakeType;
  userId: UserId;
  elements: ComparisonElementResponse<CollectionObject>[];
  winner: SnowflakeType;
  requestTime: ISO8601Date;
};

export interface ClientCollectionType<CO extends CollectionObject<any>, CollectionObjectIdType> {
  getObjectId: (object: CO) => CollectionObjectIdType;
}

export type { ISO8601Date, SnowflakeType };
