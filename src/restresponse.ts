import { ComparableObjectModel, ComparisonModel } from './types/model';
import { ComparableObjectResponse, ComparisonSelectionResponse } from './types';

import { CollectionTypeLoader } from './datainfo';

export const createComparableObjectResponse = <T>(
  comparableObject: ComparableObjectModel[],
  loader: CollectionTypeLoader<T, any>
): ComparableObjectResponse<T> => {
  if (comparableObject === undefined || comparableObject.length == 0) {
    throw Error(
      'Can\'t pass an empty array of comparable left/right elements to convert to a JSON Response object'
    );
  }
  if (loader.collectionData === undefined) {
    throw Error('Can\'t populate data when existingData has not been loaded.');
  }
  return {
    data: comparableObject.map((co) =>
      loader.getObjectForId(loader.collectionData!, co.objectId)
    ),
    elementId: comparableObject[0].elementId.toString(),
    objects: comparableObject.map((co) => co.objectId),
  };
};

export const createComparisonSelectionResponse = <T>(
  comparisonRequest: ComparisonModel,
  loader: CollectionTypeLoader<T, any>
): ComparisonSelectionResponse<T> => {
  return {
    a: createComparableObjectResponse(comparisonRequest.a, loader),
    b: createComparableObjectResponse(comparisonRequest.b, loader),
    id: comparisonRequest.id.toString(),
    userId: comparisonRequest.userId.toString(),
  };
};
