import { SnowflakeType } from './types.js';
import { basicMySqlInsert } from '@tjsr/mysql-pool-utils';

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
