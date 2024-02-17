import { CollectionObjectId, SnowflakeType } from './types.js';

import { ComparableObjectModel } from './types/model.js';
import { getSnowflake } from './snowflake.js';

export const createComparableObject = <IdType extends CollectionObjectId>(
  objectId: IdType,
  elementId: SnowflakeType
): ComparableObjectModel<IdType> => {
  return {
    elementId: elementId,
    id: getSnowflake(),
    objectId: objectId,
  };
};

export const createComparableObjectList = <IdType extends CollectionObjectId>(
  objectIdList: IdType[]
): ComparableObjectModel<IdType>[] => {
  const elementId = getSnowflake();
  return objectIdList.map((objectId) =>
    createComparableObject(objectId, elementId)
  );
};
