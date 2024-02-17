import {
  CollectionEloMap,
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonElement,
  ComparisonElementResponse,
  ComparisonResultResponse
} from '../types.js';

export const STARTING_ELO_RATING = 2000;
const ELO_WIN_DELTA = 32;

const getCurrentEloRating = <IdType extends CollectionObjectId>(
  objectEloRatings: Map<IdType, number>,
  objectId: IdType
): number => {
  const currentRating = objectEloRatings.get(objectId);
  if (currentRating === undefined) {
    return STARTING_ELO_RATING;
  }
  return currentRating;
};

const getCurrentCollectionObjectEloRating = <CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionObjectId>
  (
    objectEloRatings: Map<IdType, number>,
    collectionObject: CollectionObjectType
  ): number => {
  const currentRating = objectEloRatings.get(collectionObject.id);
  if (currentRating === undefined) {
    return STARTING_ELO_RATING;
  }
  return currentRating;
};

const getEloRatingForElementResponse = <CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionObjectId>
  (
    objectEloRatings: Map<IdType, number>,
    element: ComparisonElementResponse<CollectionObjectType, IdType>
  ): number => {
  const elementRating = element.data.map(
    (objectElement: CollectionObjectType) => getCurrentCollectionObjectEloRating(objectEloRatings, objectElement))
    .reduce((acc, cur) => acc + cur);
  return elementRating;
};

const getEloRatingForElement =
<IdType extends CollectionObjectId>(
    objectEloRatings: Map<IdType, number>,
    element: ComparisonElement<IdType>
  ): number => {
  const elementRating = element.objectIds.map(
    (objectId: CollectionObjectId) => getCurrentEloRating(objectEloRatings, objectId))
    .reduce((acc, cur) => acc + cur);
  return elementRating;
};

const updateEloRatingForResponse = <
ComparableObject extends CollectionObject<IdType>, IdType extends CollectionObjectId>
  (
    eloRatings: CollectionEloMap,
    element: ComparisonElementResponse<ComparableObject, IdType>,
    ratingUpdate: number
  ): void => {
  const elo = getEloRatingForElementResponse(eloRatings, element);
  element.data.forEach((comparableObject: ComparableObject) => {
    eloRatings.set(comparableObject.id, elo + ratingUpdate);
  });
};

const updateEloRating =
  <IdType extends CollectionObjectId>(
    eloRatings: CollectionEloMap,
    element: ComparisonElement<IdType>,
    ratingUpdate: number,
    wonByLower?: boolean
  ): void => {
    // const elo = getEloRatingForElement(eloRatings, element);
    element.objectIds.forEach((objectElementId: CollectionObjectId) => {
      const winContribution = getWinContributionRating(eloRatings, element, objectElementId);
      const contributedRating = ratingUpdate * winContribution * element.objectIds.length;
      const existingObjectElo = getCurrentEloRating(eloRatings, objectElementId);
      if (objectElementId === '1134' || wonByLower) {
        console.log(`Updating ${objectElementId} by ${contributedRating}/${ratingUpdate} `+
      `to ${existingObjectElo + contributedRating}`);
      }
      eloRatings.set(objectElementId, existingObjectElo + contributedRating);
    });
  };

const calculateExpectedOutcome = (eloRating1: number, eloRating2: number): number => 1 / (1 +
  Math.pow(10, (
    eloRating2 - eloRating1
  ) / STARTING_ELO_RATING));

export const calculateEloRatings = <
ComparableObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId
> (
    eloRating: CollectionEloMap,
    recentComparisons: ComparisonResultResponse<ComparableObjectType, IdType>[]
  ) => {
  const filteredComparisons: ComparisonResultResponse<ComparableObjectType, IdType>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<ComparableObjectType, IdType>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  console.log(`Filtered to ${filteredComparisons.length} comparisons`);

  filteredComparisons.forEach((comparison) => {
    if (comparison.elements?.every((element) => element.data.length == 1)) {
      const elementRatings: number[] = comparison.elements?.map(
        (element) => getEloRatingForElementResponse(eloRating, element)
      );
      const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
      const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];

      if (winningElement && otherElement) {
        updateEloRatingsFromResponses(eloRating, winningElement, otherElement);
        console.log(`Camparison ${elementRatings.join(' vs ')} on ${comparison.requestTime}`);
      } else {
        console.warn('Didnt get both a winning and other element.');
      }
    } else {
      // Might have more than 1 on one side of the comparison
      console.warn(`Comparison ${comparison.id} has more than 1 element on one side`);
    }
  //   const currentElo = comparison.elements.forEach((element) => {
  //     element.data.filter((d) => d.=> {
  //     element.data.filter((d) => d.forEach((data) => {
  //
  //     });
  //   });
  });
};

export const updateEloRatingsFromResponses = <IdType extends CollectionIdType>(
  eloRatings: CollectionEloMap,
  winningElement: ComparisonElementResponse<CollectionObject<IdType>, IdType>,
  otherElement: ComparisonElementResponse<CollectionObject<IdType>, IdType>
) => {
  const existingWinnerElo = getEloRatingForElementResponse(eloRatings, winningElement);
  const existingOtherElo = getEloRatingForElementResponse(eloRatings, otherElement);
  const expectedOutcomeA = calculateExpectedOutcome(existingWinnerElo, existingOtherElo);
  const expectedOutcomeB = calculateExpectedOutcome(existingOtherElo, existingWinnerElo);

  const pointsForRatingA = ELO_WIN_DELTA * (1 - expectedOutcomeA);
  const pointsForRatingB = ELO_WIN_DELTA * (0 - expectedOutcomeB);
  console.log(`Expected outcome: ${existingWinnerElo}/${pointsForRatingA} vs ${existingOtherElo}/${pointsForRatingB}`);
  updateEloRatingForResponse(eloRatings, winningElement, pointsForRatingA);
  updateEloRatingForResponse(eloRatings, otherElement, pointsForRatingB);
};

const getWinContributionRating = <IdType extends CollectionObjectId>(
  eloRatings: CollectionEloMap, element: ComparisonElement<IdType>, objectId: IdType
): number => {
  const elementElo = getEloRatingForElement(eloRatings, element);
  const objectEloRating = getCurrentEloRating(eloRatings, objectId);
  const objectRatio = objectEloRating / elementElo;
  return objectRatio;
};

const comparisonWonByLowerEloElement = <IdType extends CollectionObjectId>(
  eloRatings: CollectionEloMap,
  winningElement: ComparisonElement<IdType>,
  otherElement: ComparisonElement<IdType>
): boolean => {
  const winnerElo = getEloRatingForElement(eloRatings, winningElement);
  const otherElo = getEloRatingForElement(eloRatings, otherElement);
  return winnerElo < otherElo;
};

const elementContainsObject = <IdType extends CollectionObjectId>(
  element: ComparisonElement<IdType>, objectId: IdType): boolean => {
  return element.objectIds.includes(objectId);
};

export const updateEloRatings = <IdType extends CollectionObjectId>(
  eloRatings: CollectionEloMap,
  winningElement: ComparisonElement<IdType>,
  otherElement: ComparisonElement<IdType>
) => {
  const existingWinnerElo = getEloRatingForElement(eloRatings, winningElement);
  const existingOtherElo = getEloRatingForElement(eloRatings, otherElement);
  const expectedOutcomeA = calculateExpectedOutcome(existingWinnerElo, existingOtherElo);
  const expectedOutcomeB = calculateExpectedOutcome(existingOtherElo, existingWinnerElo);

  const pointsForRatingA = ELO_WIN_DELTA * (1 - expectedOutcomeA);
  const pointsForRatingB = ELO_WIN_DELTA * (0 - expectedOutcomeB);
  const hasDebugSearch = elementContainsObject(winningElement, '1134' as IdType) ||
  elementContainsObject(otherElement, '1134' as IdType);
  const wonByLower: boolean = comparisonWonByLowerEloElement(eloRatings, winningElement, otherElement);

  if (wonByLower || hasDebugSearch) {
    const winnerObjectList = winningElement.objectIds.map((oId) =>
      `${oId}=${Math.round(getCurrentEloRating(eloRatings, oId))}`).join(',');
    const otherObjectList = otherElement.objectIds.map((oId) =>
      `${oId}=${Math.round(getCurrentEloRating(eloRatings, oId))}`).join(',');
    console.log(`Expected outcome: 
      ${Math.round(existingWinnerElo)} +${Math.round(pointsForRatingA)}: ${expectedOutcomeA} (${winnerObjectList})
   vs ${Math.round(existingOtherElo)} ${Math.round(pointsForRatingB)}: ${expectedOutcomeB} (${otherObjectList})`);
  }
  updateEloRating(eloRatings, winningElement, pointsForRatingA);
  updateEloRating(eloRatings, otherElement, pointsForRatingB);
};
