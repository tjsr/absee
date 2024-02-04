import { ComparableObjectModel, ComparisonModel } from './types/model.js';
import {
  ComparableObjectResponse,
  ComparisonElement,
  ComparisonElementResponse,
  ComparisonResult,
  ComparisonResultResponse,
  ComparisonSelectionResponse,
  ElementEloRating,
  EloTimelineResponse
} from './types.js';

import { CollectionTypeLoader } from './datainfo.js';

const elementToElementResponse = <T>(
  element: ComparisonElement,
  loader: CollectionTypeLoader<T, any>
): ComparisonElementResponse<T> => {
  return {
    data: element.objects.map((objectId: string) => loader.getObjectForId(loader.collectionData!, objectId)),
    elementId: element.elementId.toString(),
  };
};

const resultToResultResponse = <T>(
  result:ComparisonResult,
  loader: CollectionTypeLoader<T, any>
): ComparisonResultResponse<T> => {
  const output: ComparisonResultResponse<T> = {
    elements: result.elements?.map((element: ComparisonElement) => elementToElementResponse(element, loader)),
    id: result.id.toString(),
    requestTime: result.requestTime,
    userId: result.userId.toString(),
    winner: result.winner.toString(),
  };
  return output;
};

export const createComparisonResultResponse = <T>(
  result: ComparisonResult[],
  loader: CollectionTypeLoader<T, any>
): ComparisonResultResponse<T>[] => {
  if (loader.collectionData === undefined) {
    throw Error('Can\'t populate data when existingData has not been loaded.');
  }

  try {
    return result.map((result: ComparisonResult) => resultToResultResponse(result, loader));
  } catch (err) {
    console.trace(err);
    throw new Error('Error converting result to response');
  }
};

const resultToEloTimelineResponse = <T, IDType>(
  result:ComparisonResult,
  loader: CollectionTypeLoader<T, any>,
  eloRatings: Map<IDType, number>
): EloTimelineResponse<T, IDType> => {
  const eloRatingsAfter: ElementEloRating<IDType>[] = [];
  const eloRatingsBefore: ElementEloRating<IDType>[] = [];
  const output: EloTimelineResponse<T, IDType> = {
    elements: result.elements?.map((element: ComparisonElement) => elementToElementResponse(element, loader)),
    eloRatingsAfter,
    eloRatingsBefore,
    id: result.id.toString(),
    requestTime: result.requestTime,
    userId: result.userId.toString(),
    winner: result.winner.toString(),
  };
  return output;
};

export const createEloTimelineFromComparisons = <T, IDType>(
  result: ComparisonResult[],
  loader: CollectionTypeLoader<T, IDType>
): EloTimelineResponse<T, IDType>[] => {
  if (loader.collectionData === undefined) {
    throw Error('Can\'t populate data when existingData has not been loaded.');
  }

  try {
    const eloRatings:Map<IDType, number> = new Map();
    return result.map((result: ComparisonResult) => resultToEloTimelineResponse(result, loader, eloRatings));
  } catch (err) {
    console.trace(err);
    throw new Error('Error converting result to response');
  }
};

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
  let a!: ComparableObjectResponse<T>;

  let errorString: string|undefined = undefined;
  try {
    a = createComparableObjectResponse(comparisonRequest.a, loader);
  } catch (err: any) {
    errorString = `Failed while getting object a: ${err.message}\n`;
  }

  let b!: ComparableObjectResponse<T>;
  try {
    b = createComparableObjectResponse(comparisonRequest.b, loader);
  } catch (err: any) {
    errorString = (errorString ? errorString : '') + `Failed while getting object b: ${err.message}\n`;
  }
  if (errorString) {
    throw new Error(errorString);
  }
  return {
    a: a,
    b: b,
    id: comparisonRequest.id.toString(),
    responseTime: comparisonRequest.requestTime,
    userId: comparisonRequest.userId.toString(),
  };
};
