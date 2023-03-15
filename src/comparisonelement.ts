import { ComparableObjectMetadata, ComparableObjectPutBody, SnowflakeType } from "./types";

import { sqlinsert } from "./sqlrest";

export const storeComparisonElemment = async <T>(comparisonId: SnowflakeType, comparisonElement: ComparableObjectMetadata<T>): Promise<void> => {
  const postRequest: ComparableObjectPutBody = {
    id: comparisonElement.id,
    comparisonId: comparisonId,
    elementId: comparisonElement.elementId,
    objectId: comparisonElement.objectId
  };

  return new Promise((resolve, reject) => {
    sqlinsert('ComparisonElement', postRequest).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  })
};

export const storeComparisonElements = <T>(comparisonId: SnowflakeType, comparisonElements: ComparableObjectMetadata<T>[]): Promise<void>[] => {
  const storagePromises: Promise<void>[] = [];

  comparisonElements.forEach((element) => {
    storagePromises.push(storeComparisonElemment(comparisonId, element));
  });
  return storagePromises;
};