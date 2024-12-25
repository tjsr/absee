import { DatabaseConnection, SnowflakeType } from './types.js';

import { basicMySqlInsert } from './database/basicMysqlInsert.js';

export const saveComparisonSelection = async (
  conn: DatabaseConnection,
  comparisonId: SnowflakeType,
  elementId: SnowflakeType
): Promise<void> => {
  return basicMySqlInsert(
    conn,
    'ComparisonResponse',
    ['id', 'selectedComparisonElementId'],
    { id: comparisonId, selectedComparisonElementId: elementId }
  );
};
