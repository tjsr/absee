import { CollectionObjectId, SnowflakeType } from './types.ts';

import { ComparableObjectModel } from './types/model.ts';
import { getSnowflake } from './snowflake.ts';

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
