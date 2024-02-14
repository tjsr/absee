import {
  CollectionObject,
  CollectionObjectEloRating,
  CollectionObjectId,
  ComparableObjectResponse,
  ComparisonElement,
  ComparisonElementResponse,
  ComparisonResult,
  ComparisonResultResponse,
  ComparisonSelectionResponse,
  EloTimeline
} from './types.js';
import { ComparableObjectModel, ComparisonModel } from './types/model.js';
import { STARTING_ELO_RATING, updateEloRatings } from './rankings/elo.js';

import { CollectionTypeLoader } from './datainfo.js';

const elementToElementResponse = <
  CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
    element: ComparisonElement<IdType>,
    loader: CollectionTypeLoader<CollectionObjectType, any, IdType>
  ): ComparisonElementResponse<CollectionObjectType, IdType> => {
  return {
    data: element.objectIds.map((objectId: IdType) =>
      loader.getObjectForId(loader.collectionData!, objectId)),
    elementId: element.elementId.toString(),
  };
};

const resultToResultResponse = <CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionObjectId>(
    result:ComparisonResult<IdType>,
    loader: CollectionTypeLoader<CollectionObjectType, any, IdType>
  ): ComparisonResultResponse<CollectionObjectType, IdType> => {
  const output: ComparisonResultResponse<CollectionObjectType, IdType> = {
    elements: result.elements?.map((element: ComparisonElement<IdType>) => elementToElementResponse(element, loader)),
    id: result.id.toString(),
    requestTime: result.requestTime,
    userId: result.userId.toString(),
    winner: result.winner.toString(),
  };
  return output;
};

export const createComparisonResultResponse = <
CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
    result: ComparisonResult<IdType>[],
    loader: CollectionTypeLoader<CollectionObjectType, any, IdType>
  ): ComparisonResultResponse<CollectionObjectType, IdType>[] => {
  if (loader.collectionData === undefined) {
    throw Error('Can\'t populate data when existingData has not been loaded.');
  }

  try {
    return result.map((result: ComparisonResult<IdType>) => resultToResultResponse(result, loader));
  } catch (err) {
    console.trace(err);
    throw new Error('Error converting result to response');
  }
};

const getEloRatingsOfElements = <IdType extends CollectionObjectId>(
  eloRatings: Map<IdType, number>, result:ComparisonResult<IdType>
): CollectionObjectEloRating<IdType>[] => {
  const output: CollectionObjectEloRating<IdType>[] = [];
  if (!result?.elements) {
    console.warn(`ComparisonResult ${result?.id} had no elements array.`);
  }
  result?.elements?.forEach((element: ComparisonElement<IdType>) => {
    element?.objectIds?.forEach((objectId: CollectionObjectId) => {
      const objectEloRating = eloRatings.get(objectId as unknown as IdType) || STARTING_ELO_RATING;
      output.push({ objectId: objectId as unknown as IdType, rating: objectEloRating });
    });
  });

  return output;
};

// const resultToEloTimelineResponse = <T, IDType extends SnowflakeType|object|number>(
//   result:ComparisonResult,
//   loader: CollectionTypeLoader<T, any>,
//   eloRatings: Map<IDType, number>
// ): EloTimelineResponse<T, IDType> => {
//   const eloRatingsAfter: ElementEloRating<IDType>[] = getEloRatingsOfElements(eloRatings, result);

//   const winningElement: ComparisonElement =
// result.elements?.filter((element) => element.elementId == result.winner)[0];
//   const otherElement: ComparisonElement =
// result.elements?.filter((element) => element.elementId != result.winner)[0];

//   if (winningElement && otherElement) {
//     updateEloRatings(eloRatings, winningElement, otherElement);
//     // console.log(`Camparison ${elementRatings.join(' vs ')} on ${result.requestTime}`);
//   } else {
//     console.warn('Didnt get both a winning and other element.');
//   }

//   const eloRatingsBefore: ElementEloRating<IDType>[] = [];
//   const output: EloTimelineResponse<T, IDType> = {
//     elements: result.elements?.map((element: ComparisonElement) => elementToElementResponse(element, loader)),
//     eloRatingsAfter,
//     eloRatingsBefore,
//     id: result.id.toString(),
//     requestTime: result.requestTime,
//     userId: result.userId.toString(),
//     winner: result.winner.toString(),
//   };
//   return output;
// };

const updateObjectEvolutions = <IdType extends CollectionObjectId>(
  evolutionElements: ComparisonElement<IdType>[], objectEvolutions: Map<IdType, number>
) => {
  evolutionElements.forEach((element) => {
    element.objectIds.forEach((objectId: IdType) => {
      if (!objectEvolutions.has(objectId)) {
        objectEvolutions.set(objectId, 1);
      } else {
        const currentEvo = objectEvolutions.get(objectId)!;
        objectEvolutions.set(objectId, currentEvo + 1);
      }
    });
  });
};

const resultToEloTimeline = <IdType extends CollectionObjectId>(
  result:ComparisonResult<IdType>,
  eloRatings: Map<IdType, number>,
  objectEvolutions: Map<IdType, number>
): EloTimeline<IdType> => {
  if (!result?.elements) {
    console.warn(`ComparisonResult ${result?.id} had no comparison elements.`);
  }
  const eloRatingsBefore: CollectionObjectEloRating<IdType>[] = getEloRatingsOfElements(eloRatings, result);
  let eloRatingsAfter: CollectionObjectEloRating<IdType>[] = [];

  const winningElement: ComparisonElement<IdType> =
    result.elements?.filter((element) => element.elementId == result.winner)[0];
  const otherElement: ComparisonElement<IdType> =
    result.elements?.filter((element) => element.elementId != result.winner)[0];

  if (winningElement && otherElement) {
    updateEloRatings(eloRatings, winningElement, otherElement);
    updateObjectEvolutions([winningElement, otherElement], objectEvolutions);

    eloRatingsAfter = getEloRatingsOfElements(eloRatings, result);
    // console.log(`Camparison ${elementRatings.join(' vs ')} on ${result.requestTime}`);
  } else {
    console.warn('Didnt get both a winning and other element.');
  }

  const output: EloTimeline<IdType> = {
    elements: result.elements,
    eloRatingsAfter,
    eloRatingsBefore,
    id: result.id.toString(),
    requestTime: result.requestTime,
    userId: result.userId.toString(),
    winner: result.winner.toString(),
  };
  return output;
};

export const createEloTimelineFromComparisons = <IdType extends CollectionObjectId>(
  result: ComparisonResult<IdType>[]
): EloTimeline<IdType>[] => {
  try {
    const eloRatings:Map<IdType, number> = new Map();
    const objectEvolutions:Map<IdType, number> = new Map();
    return result.filter((r) => r.elements !== undefined)
      .sort((r1, r2) => r1.requestTime.getTime() - r2.requestTime.getTime())
      .map((result: ComparisonResult<IdType>) => resultToEloTimeline(result, eloRatings, objectEvolutions));
  } catch (err) {
    console.trace(err);
    throw new Error('Error converting result to timeline element');
  }
};

export const createComparableObjectResponse = <
CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
    comparableObject: ComparableObjectModel<IdType>[],
    loader: CollectionTypeLoader<CollectionObjectType, any, IdType>
  ): ComparableObjectResponse<CollectionObjectType> => {
  if (comparableObject === undefined || comparableObject.length == 0) {
    throw Error(
      'Can\'t pass an empty array of comparable left/right elements to convert to a JSON Response object'
    );
  }
  if (loader.collectionData === undefined) {
    throw Error('Can\'t populate data when existingData has not been loaded.');
  }
  return {
    data: comparableObject.map((co: ComparableObjectModel<IdType>) =>
      loader.getObjectForId(loader.collectionData!, co.objectId as IdType)
    ),
    elementId: comparableObject[0].elementId.toString(),
    objects: comparableObject.map((co) => co.objectId),
  };
};

export const createComparisonSelectionResponse = <
CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
    comparisonRequest: ComparisonModel<IdType>,
    loader: CollectionTypeLoader<CollectionObjectType, any, IdType>
  ): ComparisonSelectionResponse<CollectionObjectType> => {
  let a!: ComparableObjectResponse<CollectionObjectType>;

  let errorString: string|undefined = undefined;
  try {
    a = createComparableObjectResponse(comparisonRequest.a, loader);
  } catch (err: any) {
    errorString = `Failed while getting object a: ${err.message}\n`;
  }

  let b!: ComparableObjectResponse<CollectionObjectType>;
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
