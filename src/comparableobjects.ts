import { ComparableObjectModel } from "./types/model";
import { SnowflakeType } from "./types";
import { getElementData } from "..";
import { getSnowflake } from "./snowflake";

const createComparableObject = <T>(objectId: string, elementId: SnowflakeType): ComparableObjectModel<T> => {
  return {
    id: getSnowflake(),
    elementId: elementId,
    objectId: objectId,
    data: getElementData(objectId),
  };
};

export const createComparableObjectList = <T>(objectIdList: string[], comparisonId: SnowflakeType): ComparableObjectModel<T>[] => {
  const elementId = getSnowflake();
  return objectIdList.map((objectId) => createComparableObject(objectId, elementId))
};
