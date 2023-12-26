import { ComparableObjectModel } from './types/model';
import { SnowflakeType } from './types';
import { getSnowflake } from './snowflake';

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
