import { SnowflakeType } from './types';
import {
  basicMySqlInsert
} from './database/mysql';

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
