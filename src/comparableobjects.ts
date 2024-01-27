import { ComparableObjectModel } from './types/model.js';
import { SnowflakeType } from './types.js';
import { getSnowflake } from './snowflake.js';

export const createComparableObject = (
  objectId: string,
  elementId: SnowflakeType
): ComparableObjectModel => {
  return {
    elementId: elementId,
    id: getSnowflake(),
    objectId: objectId,
  };
};

export const createComparableObjectList = (
  objectIdList: string[]
): ComparableObjectModel[] => {
  const elementId = getSnowflake();
  return objectIdList.map((objectId) =>
    createComparableObject(objectId, elementId)
  );
};
