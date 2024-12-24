import { ISO8601Date, SnowflakeType } from './types/mysqltypes.js';
import { Pool, getConnection } from '@tjsr/mysql-pool-utils';
import { SessionStoreDataType, UserSessionData, UserSessionOptions } from '@tjsr/user-session-middleware';

import { ExpressServerConfig } from '@tjsr/express-server-helper';
import { GoogleAuthSettings } from './auth/types.js';

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
export type CollectionObjectId = string|uuid;
export type ComparisonElementId = SnowflakeType;
export type ComparisonResultId = SnowflakeType;
export type ComparisonId = SnowflakeType;
export interface CollectionObject<CollectionObjectIdType extends CollectionObjectId> {
  id: CollectionObjectIdType
}
export type CollectionEloMap = Map<CollectionObjectId, number>;

export type ComparableObjectPutBody = {
  id: SnowflakeType;
  comparisonId: ComparisonId;
  elementId: ComparisonElementId;
  objectId: string;
};

export type ComparableObjectResponse<CollectionObjectType> = {
  elementId: ComparisonElementId;
  objects: CollectionObjectId[];
  data: CollectionObjectType[];
};

export type ComparisonSelectionResponse<CollectionObject> = {
  id: SnowflakeType;
  responseTime: ISO8601Date;
  userId: UserId;
  a: ComparableObjectResponse<CollectionObject>;
  b: ComparableObjectResponse<CollectionObject>;
};

export type ComparisonElementResponse<
  CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId = CollectionObjectId
> = {
  elementId: ComparisonElementId;
  data: CollectionObjectType[];
}

export type ComparisonElement<IdType extends CollectionObjectId = CollectionObjectId> = {
  elementId: ComparisonElementId;
  objectIds: IdType[];
}

export type ComparisonResult<IdType extends CollectionObjectId = CollectionObjectId> = {
  id: ComparisonResultId;
  userId: UserId;
  elements: ComparisonElement<IdType>[];
  winner: ComparisonElementId;
  requestTime: ISO8601Date;
};

export interface ComparisonResultResponse<
  CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId = CollectionObjectId,
> {
  id: SnowflakeType;
  userId: UserId;
  elements: ComparisonElementResponse<CollectionObjectType, IdType>[];
  winner: ComparisonElementId;
  requestTime: ISO8601Date;
}

export interface CollectionObjectEloRating<IdType extends CollectionObjectId = CollectionObjectId> {
  objectId: IdType;
  rating: number;
}

export interface EloTimeline<CollectionObjectIdType extends CollectionObjectId = CollectionObjectId>
  extends ComparisonResult<CollectionObjectIdType> {
  eloRatingsAfter: CollectionObjectEloRating<CollectionObjectIdType>[];
  eloRatingsBefore: CollectionObjectEloRating<CollectionObjectIdType>[];
}

export interface EloTimelineResponse<
  CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId = CollectionObjectId,
>
  extends ComparisonResultResponse<CollectionObjectType, IdType> {
  collectionObjects: CollectionObjectType[];
  eloRatingsAfter: CollectionObjectEloRating<IdType>[];
  eloRatingsBefore: CollectionObjectEloRating<IdType>[];
}

export interface ClientCollectionType<
  IdType extends CollectionObjectId,
  CollectionObjectType extends CollectionObject<IdType>
> {
  getObjectId: (object: CollectionObjectType) => IdType;
}

export type { ISO8601Date, SnowflakeType };

export interface AbseeConfig extends ExpressServerConfig {
  initConnections?: boolean;
  connectionPool: Pool;
  googleAuthSettings: GoogleAuthSettings;
}

export type AbseeMinimumConfig = AbseeConfig & Partial<ExpressServerConfig> & UserSessionOptions;

export type AbseeUserSessionData = UserSessionData;
export type AbseeSessionStoreDataType = SessionStoreDataType;

export type DatabaseConnection = ReturnType<typeof getConnection>;
