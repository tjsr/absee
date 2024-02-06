import {
  CollectionObjectType,
  ComparisonElement,
  ComparisonElementResponse,
  ComparisonResultResponse,
  SnowflakeType
} from '../types.js';

const STARTING_ELO_RATING = 400;
const ELO_WIN_DELTA = 32;

const getCurrentEloRating = (
  elementEloRatings: Map<SnowflakeType|object|number, number>,
  elementId: string
): number => {
  const currentRating = elementEloRatings.get(elementId);
  if (currentRating === undefined) {
    return STARTING_ELO_RATING;
  }
  return currentRating;
};

const getCurrentCollectionObjectEloRating = <CollectionObject extends CollectionObjectType<IdType>,
IdType extends object|number>
  (
    elementEloRatings: Map<SnowflakeType|object|number, number>,
    element: CollectionObject
  ): number => {
  const currentRating = elementEloRatings.get(element.id);
  if (currentRating === undefined) {
    return STARTING_ELO_RATING;
  }
  return currentRating;
};

const getEloRatingForElementResponse = <CollectionObject extends CollectionObjectType<IdType>,
IdType extends object|number>
  (
    elementEloRatings: Map<SnowflakeType|object|number, number>,
    element: ComparisonElementResponse<CollectionObject>
  ): number => {
  const elementRating = element.data.map(
    (objectElement: CollectionObject) => getCurrentCollectionObjectEloRating(elementEloRatings, objectElement))
    .reduce((acc, cur) => acc + cur);
  return elementRating;
};

const getEloRatingForElement =
(
  elementEloRatings: Map<SnowflakeType|object|number, number>,
  element: ComparisonElement
): number => {
  const elementRating = element.objects.map(
    (objectElementId: string) => getCurrentEloRating(elementEloRatings, objectElementId))
    .reduce((acc, cur) => acc + cur);
  return elementRating;
};

const updateEloRatingForResponse = <ComparableObject extends CollectionObjectType<IdType>, IdType extends object|number>
  (
    eloRatings: Map<SnowflakeType|object|number, number>,
    element: ComparisonElementResponse<ComparableObject>,
    ratingUpdate: number
  ): void => {
  const elo = getEloRatingForElementResponse(eloRatings, element);
  element.data.forEach((objectId: ComparableObject) => {
    eloRatings.set(objectId, elo + ratingUpdate);
  });
};

const updateEloRating =
  (
    eloRatings: Map<SnowflakeType|object|number, number>,
    element: ComparisonElement,
    ratingUpdate: number
  ): void => {
    const elo = getEloRatingForElement(eloRatings, element);
    element.objects.forEach((objectElementId: string) => {
      eloRatings.set(objectElementId, elo + ratingUpdate);
    });
  };

const calculateExpectedOutcome = (eloRating1: number, eloRating2: number): number => 1 / (1 +
  Math.pow(10, (
    eloRating2 - eloRating1
  ) / STARTING_ELO_RATING));

export const calculateEloRatings = <ComparableObject extends CollectionObjectType<IdType>, IdType extends object|number>
  (
    eloRating: Map<SnowflakeType|object|number, number>,
    recentComparisons: ComparisonResultResponse<ComparableObject>[]
  ) => {
  const filteredComparisons: ComparisonResultResponse<ComparableObject>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<ComparableObject>) =>
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

export const updateEloRatingsFromResponses = (
  eloRatings: Map<SnowflakeType|object|number, number>,
  winningElement: ComparisonElementResponse<CollectionObjectType<any>>,
  otherElement: ComparisonElementResponse<CollectionObjectType<any>>
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

export const updateEloRatings = (
  eloRatings: Map<SnowflakeType|object|number, number>,
  winningElement: ComparisonElement,
  otherElement: ComparisonElement
) => {
  const existingWinnerElo = getEloRatingForElement(eloRatings, winningElement);
  const existingOtherElo = getEloRatingForElement(eloRatings, otherElement);
  const expectedOutcomeA = calculateExpectedOutcome(existingWinnerElo, existingOtherElo);
  const expectedOutcomeB = calculateExpectedOutcome(existingOtherElo, existingWinnerElo);

  const pointsForRatingA = ELO_WIN_DELTA * (1 - expectedOutcomeA);
  const pointsForRatingB = ELO_WIN_DELTA * (0 - expectedOutcomeB);
  console.log(`Expected outcome: ${existingWinnerElo}/${pointsForRatingA} vs ${existingOtherElo}/${pointsForRatingB}`);
  updateEloRating(eloRatings, winningElement, pointsForRatingA);
  updateEloRating(eloRatings, otherElement, pointsForRatingB);
};
