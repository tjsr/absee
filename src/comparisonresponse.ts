import { SnowflakeType } from './types.js';
import { basicMySqlInsert } from './database/basicMysqlInsert.js';

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
