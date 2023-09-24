import { ComparableObjectPutBody, SnowflakeType } from './types';

import { ComparableObjectModel } from './types/model';
import { basicMySqlInsert } from './database/basicMysqlInsert';

export const storeComparisonElement = async (
  comparisonId: SnowflakeType,
  comparisonElement: ComparableObjectModel
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

export const storeComparisonElements = (
  comparisonId: SnowflakeType,
  comparisonElements: ComparableObjectModel[]
): Promise<void>[] => {
  const storagePromises: Promise<void>[] = [];

  comparisonElements.forEach((element) => {
    storagePromises.push(storeComparisonElement(comparisonId, element));
  });
  return storagePromises;
};
