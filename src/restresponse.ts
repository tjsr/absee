import { ComparableObjectModel, ComparisonModel } from "./types/model";
import { ComparableObjectResponse, ComparisonSelectionResponse } from "./types";

import { CollectionTypeLoader } from "./datainfo";

export const createComparableObjectResponse = <T>(comparableObject: ComparableObjectModel<T>[], loader: CollectionTypeLoader<T>): ComparableObjectResponse<T> => {
  if (comparableObject === undefined || comparableObject.length == 0) {
    throw Error("Can't pass an empty array of comparable left/right elements to convert to a JSON Response object");
  }
  if (loader.existingData === undefined) {
    throw Error("Can't populate data when existingData has not been loaded.");
  }
  return {
    elementId: comparableObject[0].elementId,
    objects: comparableObject.map((co) => co.objectId),
    data: comparableObject.map((co) => loader.getObjectForId(loader.existingData!, co.objectId))
  };
};

export const createComparisonSelectionResponse = <T>(comparisonRequest: ComparisonModel<T>, loader: CollectionTypeLoader<T>): ComparisonSelectionResponse<T> => {
  return {
    id: comparisonRequest.id,
    userId: comparisonRequest.userId,
    a: createComparableObjectResponse(comparisonRequest.a, loader),
    b: createComparableObjectResponse(comparisonRequest.b, loader),
  }
}
