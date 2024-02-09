import { ISO8601Date, SnowflakeType } from './types/mysqltypes.js';

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
export type ComparisonElementId = SnowflakeType;
export type ComparisonResultId = SnowflakeType;
export type ComparisonId = SnowflakeType;
export interface CollectionObjectType<CollectionObjectIdType> {
  id: CollectionObjectIdType
}

export type ComparableObjectPutBody = {
  id: SnowflakeType;
  comparisonId: ComparisonId;
  elementId: ComparisonElementId;
  objectId: string;
};

export type ComparableObjectResponse<CollectionObjectType> = {
  elementId: ComparisonElementId;
  objects: string[];
  data: CollectionObjectType[];
};

export type ComparisonSelectionResponse<CollectionObject> = {
  id: SnowflakeType;
  responseTime: ISO8601Date;
  userId: UserId;
  a: ComparableObjectResponse<CollectionObject>;
  b: ComparableObjectResponse<CollectionObject>;
};

export type ComparisonElementResponse<CollectionObject> = {
  elementId: ComparisonElementId;
  data: CollectionObject[];
}

export type ComparisonElement = {
  elementId: ComparisonElementId;
  objects: string[];
}

export type ComparisonResult = {
  id: ComparisonResultId;
  userId: UserId;
  elements: ComparisonElement[];
  winner: ComparisonElementId;
  requestTime: ISO8601Date;
};

export interface ComparisonResultResponse<CollectionObject> {
  id: SnowflakeType;
  userId: UserId;
  elements: ComparisonElementResponse<CollectionObject>[];
  winner: ComparisonElementId;
  requestTime: ISO8601Date;
}

export interface CollectionObjectEloRating<CollectionObjectId extends CollectionObjectIdType> {
  objectId: CollectionObjectId;
  rating: number;
}

export interface EloTimeline<CollectionObjectId extends CollectionObjectIdType>
  extends ComparisonResult {
  eloRatingsAfter: CollectionObjectEloRating<CollectionObjectId>[];
  eloRatingsBefore: CollectionObjectEloRating<CollectionObjectId>[];
}

export interface EloTimelineResponse<
CollectionObject extends CollectionObjectType<CollectionObjectId>, CollectionObjectId extends CollectionObjectIdType
>
  extends ComparisonResultResponse<CollectionObject> {
  eloRatingsAfter: CollectionObjectEloRating<CollectionObjectId>[];
  eloRatingsBefore: CollectionObjectEloRating<CollectionObjectId>[];
}

export interface ClientCollectionType<
  CO extends CollectionObjectType<any>, CollectionObjectId extends CollectionObjectIdType
> {
  getObjectId: (object: CO) => CollectionObjectId;
}

export type { ISO8601Date, SnowflakeType };
