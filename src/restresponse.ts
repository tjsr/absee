import { ComparableObjectModel, ComparisonModel } from "./types/model";
import { ComparableObjectResponse, ComparisonSelectionResponse } from "./types";

export const createComparableObjectResponse = <T>(comparableObject: ComparableObjectModel<T>[]): ComparableObjectResponse<T> => {
  if (comparableObject === undefined || comparableObject.length == 0) {
    throw Error("Can't pass an empty array of comparable left/right elements to convert to a JSON Response object");
  }
  return {
    elementId: comparableObject[0].elementId,
    objects: comparableObject.map((co) => co.objectId),
    data: comparableObject.map((co) => co.data)
  };
};

export const createComparisonSelectionResponse = <T>(comparisonRequest: ComparisonModel<T>): ComparisonSelectionResponse<T> => {
  return {
    id: comparisonRequest.id,
    userId: comparisonRequest.userId,
    a: createComparableObjectResponse(comparisonRequest.a),
    b: createComparableObjectResponse(comparisonRequest.b),
  }
}
