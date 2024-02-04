import { CollectionObject, ComparisonElementResponse, ComparisonResultResponse, SnowflakeType } from '../types.js';

const STARTING_ELO_RATING = 400;
const ELO_WIN_DELTA = 32;

const getCurrentEloRating = <CollectionObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (
    elementEloRatings: Map<SnowflakeType|object|number, number>,
    element: CollectionObjectType
  ): number => {
  const currentRating = elementEloRatings.get(element.id);
  if (currentRating === undefined) {
    return STARTING_ELO_RATING;
  }
  return currentRating;
};

const getEloRatingForElement = <CollectionObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (
    elementEloRatings: Map<SnowflakeType|object|number, number>,
    element: ComparisonElementResponse<CollectionObjectType>
  ): number => {
  const elementRating = element.data.map(
    (objectElement: CollectionObjectType) => getCurrentEloRating(elementEloRatings, objectElement))
    .reduce((acc, cur) => acc + cur);
  return elementRating;
};

const updateEloRating = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (
    eloRatings: Map<SnowflakeType|object|number, number>,
    element: ComparisonElementResponse<ComparableObjectType>,
    ratingUpdate: number
  ): void => {
  const elo = getEloRatingForElement(eloRatings, element);
  element.data.forEach((objectElement: ComparableObjectType) => {
    eloRatings.set(objectElement.id, elo + ratingUpdate);
  });
};

const calculateExpectedOutcome = (eloRating1: number, eloRating2: number): number => 1 / (1 +
  Math.pow(10, (
    eloRating2 - eloRating1
  ) / STARTING_ELO_RATING));

export const calculateEloRatings = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (
    eloRating: Map<SnowflakeType|object|number, number>,
    recentComparisons: ComparisonResultResponse<ComparableObjectType>[]
  ) => {
  const filteredComparisons: ComparisonResultResponse<ComparableObjectType>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<ComparableObjectType>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  console.log(`Filtered to ${filteredComparisons.length} comparisons`);

  filteredComparisons.forEach((comparison) => {
    if (comparison.elements?.every((element) => element.data.length == 1)) {
      const elementRatings: number[] = comparison.elements?.map(
        (element) => getEloRatingForElement(eloRating, element)
      );
      const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
      const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];

      if (winningElement && otherElement) {
        updateEloRatings(eloRating, winningElement, otherElement);
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

export const updateEloRatings = (
  eloRatings: Map<SnowflakeType|object|number, number>,
  winningElement: ComparisonElementResponse<CollectionObject<any>>,
  otherElement: ComparisonElementResponse<CollectionObject<any>>
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
