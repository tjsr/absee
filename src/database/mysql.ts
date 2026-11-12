import {
  CollectionIdType,
  EmailAddress,
} from '../types.ts';
import { FieldPacket, QueryResult } from '@tjsr/mysql-pool-utils';

import type { QueryResultType } from './queryTypes.ts';
import { UserModel } from '../types/model.ts';
import { createUserIdFromEmail } from '../auth/user.ts';

export type MysqlQueryResultType = QueryResultType<QueryResult, FieldPacket>;

// CE.comparisonId, CE.objectId, CE.elementId, CE.id as comparisonElementId


export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};

export type CollectionTypeData = {
  cachedData: string;
  collectionId: CollectionIdType;
  datasource: string;
  description: string;
  lastUpdateTime: Date;
  maxElementsPerComparison: number;
  name: string;
};

