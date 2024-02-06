import {
  CollectionObjectIdType,
  CollectionObjectType,
  ComparisonElementResponse,
  ComparisonResultResponse,
  SnowflakeType
} from '../types.js';

// import { getComparableObjectId } from './ids.js";
const DEFAULT_ELEMENT_VALUE = 15;

const getComparableObjectId = <T extends CollectionObjectType<IdType>,
  IdType>(object: T): IdType => {
  return object.id;
};

export const getCurrentValue = <CO extends CollectionObjectType<IdType>, IdType extends object|number>
  (
    elementValues: Map<SnowflakeType|object|number, number>,
    element: CO
  ): number => {
  const currentValue = elementValues.get(element.id);
  if (currentValue === undefined) {
    return DEFAULT_ELEMENT_VALUE;
  }
  return currentValue;
};

export const getObjectValue = <CO extends CollectionObjectType<IdType>, IdType extends object|number>(
  objectValues: Map<IdType, number>,
  comparableObject: CO
): number|undefined => {
  const id = getComparableObjectId<CO, IdType>(comparableObject);
  const objectValue = objectValues.get(id);
  return objectValue;
};

export const getElementValue = <CO extends CollectionObjectType<IdType>, IdType extends object|number>
  (
    elementValues: Map<SnowflakeType|object|number, number>,
    element: ComparisonElementResponse<CO>
  ): number => {
  const elementRating = element.data.map(
    (elementData: CO) => getCurrentValue(elementValues, elementData)).reduce((acc, cur) => acc + cur);
  return elementRating;
};

export const updateObjectValue = <CO extends CollectionObjectType<IdType>,
  IdType extends object|number>(
    objectValues: Map<IdType, number>, comparableObject: CO, updatedValue: number
  ): void => {
  const objectId = getComparableObjectId<CO, IdType>(
    comparableObject
  );
  console.log(`Updating ${objectId} to ${updatedValue}`);
  objectValues.set(objectId, updatedValue);
};

export const calculateRelativeValues = <
CO extends CollectionObjectType<IdType>,
  IdType extends object|number
> (
    objectValues: Map<CollectionObjectIdType, number>,
    elementValues: Map<SnowflakeType|object|number, number>,
    recentComparisons: ComparisonResultResponse<CO>[]
  ) => {
  const filteredComparisons: ComparisonResultResponse<CO>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<CO>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  filteredComparisons.forEach((comparison) => {
    // const elementValues: number[] = comparison.elements?.map((element) => getElementValue(element));
    const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
    const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];
    if (winningElement && otherElement) {
      if (winningElement.data.length === 1) {
        const otherElementValue = getElementValue<CO, IdType>(elementValues, otherElement);
        // const otherElementValue = getObjectValue<ComparableObjectType, IdType>(otherElement.data[0]) ??
        //   DEFAULT_ELEMENT_VALUE * (otherElement.data?.length ?? 1);
        const winningElementValue = getElementValue<CO, IdType>(elementValues, winningElement);
        const comparisonElementString = comparison.elements?.map(
          (e) => {
            const elementDataItemsString = e.data.map((d) =>
              getComparableObjectId<CO, IdType>(d)).join(',');
            return elementDataItemsString;
          }).join(' vs ');

        if (otherElementValue > winningElementValue) {
          const updatedElementValue = otherElementValue ? otherElementValue + 1 : DEFAULT_ELEMENT_VALUE;
          updateObjectValue<CO, IdType>(
            objectValues, winningElement.data[0], updatedElementValue
          );
          const individualValues = otherElement.data.map(
            (elementData: CO) => getCurrentValue(objectValues, elementData)).join('+');
          console.log(`Camparison ${comparisonElementString} on ${comparison.requestTime} ${otherElementValue} ` +
            `updated to ${individualValues}=${updatedElementValue}`);
        } else {
          console.log(`Comparison of ${comparisonElementString} winning ` +
          `value ${winningElementValue} already exceeds other value ${otherElementValue}.`);
        }
      }
    }
  });
};
