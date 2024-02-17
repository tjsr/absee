import { CollectionObjectId, ComparableObjectPutBody, SnowflakeType } from './types.js';

import { ComparableObjectModel } from './types/model.js';
import { basicMySqlInsert } from './database/basicMysqlInsert.js';

export const storeComparisonElement = async <IdType extends CollectionObjectId>(
  comparisonId: SnowflakeType,
  comparisonElement: ComparableObjectModel<IdType>
): Promise<void> => {
  const postRequest: ComparableObjectPutBody = {
    comparisonId: comparisonId,
    elementId: comparisonElement.elementId,
    id: comparisonElement.id,
    objectId: comparisonElement.objectId,
  };
  return basicMySqlInsert(
    'ComparisonElement',
    // ['id', 'comparisonId', 'elementId', 'objectId'],
    ['comparisonId', 'elementId', 'id', 'objectId'],
    postRequest
  );
};

export const storeComparisonElements = <IdType extends CollectionObjectId>(
  comparisonId: SnowflakeType,
  comparisonElements: ComparableObjectModel<IdType>[]
): Promise<void>[] => {
  const storagePromises: Promise<void>[] = [];

  comparisonElements.forEach((element) => {
    storagePromises.push(storeComparisonElement(comparisonId, element));
  });
  return storagePromises;
};
