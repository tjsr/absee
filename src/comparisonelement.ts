import { ComparableObjectPutBody, SnowflakeType } from './types';
import {
  PoolConnection,
  basicMySqlInsert,
  getConnection,
} from './database/mysql';

import { ComparableObjectModel } from './types/model';

export const storeComparisonElement = async <T>(
  comparisonId: SnowflakeType,
  comparisonElement: ComparableObjectModel<T>
): Promise<void> => {
  const postRequest: ComparableObjectPutBody = {
    comparisonId: comparisonId,
    elementId: comparisonElement.elementId,
    id: comparisonElement.id,
    objectId: comparisonElement.objectId,
  };
  return basicMySqlInsert(
    'ComparisonElement',
    ['id', 'comparisonId', 'elementId', 'objectId'],
    postRequest
  );
};

export const storeComparisonElements = <T>(
  comparisonId: SnowflakeType,
  comparisonElements: ComparableObjectModel<T>[]
): Promise<void>[] => {
  const storagePromises: Promise<void>[] = [];

  comparisonElements.forEach((element) => {
    storagePromises.push(storeComparisonElement(comparisonId, element));
  });
  return storagePromises;
};
