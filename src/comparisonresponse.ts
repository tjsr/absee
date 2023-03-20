import {
  PoolConnection,
  basicMySqlInsert,
  getConnection,
} from './database/mysql';

import { SnowflakeType } from './types';

export const saveComparisonSelection = async (
  comparisonId: SnowflakeType,
  elementId: SnowflakeType
): Promise<void> => {
  return basicMySqlInsert(
    'ComparisonResponse',
    ['id', 'selectedComparisonElementId'],
    { id: comparisonId, selectedComparisonElementId: elementId }
  );
};
