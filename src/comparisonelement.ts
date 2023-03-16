import { ComparableObjectPutBody, SnowflakeType } from "./types";

import { ComparableObjectModel } from "./types/model";
import { sqlinsert } from "./sqlrest";

export const storeComparisonElement = async <T>(comparisonId: SnowflakeType, comparisonElement: ComparableObjectModel<T>): Promise<void> => {
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

export const storeComparisonElements = <T>(comparisonId: SnowflakeType, comparisonElements: ComparableObjectModel<T>[]): Promise<void>[] => {
  const storagePromises: Promise<void>[] = [];

  comparisonElements.forEach((element) => {
    storagePromises.push(storeComparisonElement(comparisonId, element));
  });
  return storagePromises;
};