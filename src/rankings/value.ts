import {
  CollectionObject,
  CollectionObjectIdType,
  ComparisonElementResponse,
  ComparisonResultResponse,
  SnowflakeType
} from '../types.js';
// import { getComparableObjectId } from './ids.js";
const DEFAULT_ELEMENT_VALUE = 15;

const getComparableObjectId = <T extends CollectionObject<IdType>,
  IdType>(object: T): IdType => {
  return object.id;
};

export const getCurrentValue = <CollectionObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (
    elementValues: Map<SnowflakeType|object|number, number>,
    element: CollectionObjectType
  ): number => {
  const currentValue = elementValues.get(element.id);
  if (currentValue === undefined) {
    return DEFAULT_ELEMENT_VALUE;
  }
  return currentValue;
};

export const getObjectValue = <T extends CollectionObject<IdType>, IdType extends object|number>(
  objectValues: Map<IdType, number>,
  comparableObject: T
): number|undefined => {
  const id = getComparableObjectId<T, IdType>(comparableObject);
  const objectValue = objectValues.get(id);
  return objectValue;
};

export const getElementValue = <T extends CollectionObject<IdType>, IdType extends object|number>
  (
    elementValues: Map<SnowflakeType|object|number, number>,
    element: ComparisonElementResponse<T>
  ): number => {
  const elementRating = element.data.map(
    (elementData: T) => getCurrentValue(elementValues, elementData)).reduce((acc, cur) => acc + cur);
  return elementRating;
};

export const updateObjectValue = <T extends CollectionObject<IdType>,
  IdType extends object|number>(objectValues: Map<IdType, number>, comparableObject: T, updatedValue: number): void => {
  const objectId = getComparableObjectId<CollectionObject<IdType>, IdType>(
    comparableObject
  );
  console.log(`Updating ${objectId} to ${updatedValue}`);
  objectValues.set(objectId, updatedValue);
};

export const calculateRelativeValues = <
  ComparableObjectType extends CollectionObject<IdType>,
  IdType extends object|number
> (
    objectValues: Map<CollectionObjectIdType, number>,
    elementValues: Map<SnowflakeType|object|number, number>,
    recentComparisons: ComparisonResultResponse<ComparableObjectType>[]
  ) => {
  const filteredComparisons: ComparisonResultResponse<ComparableObjectType>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<ComparableObjectType>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  filteredComparisons.forEach((comparison) => {
    // const elementValues: number[] = comparison.elements?.map((element) => getElementValue(element));
    const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
    const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];
    if (winningElement && otherElement) {
      if (winningElement.data.length === 1) {
        const otherElementValue = getElementValue<ComparableObjectType, IdType>(elementValues, otherElement);
        // const otherElementValue = getObjectValue<ComparableObjectType, IdType>(otherElement.data[0]) ??
        //   DEFAULT_ELEMENT_VALUE * (otherElement.data?.length ?? 1);
        const winningElementValue = getElementValue<ComparableObjectType, IdType>(elementValues, winningElement);
        const comparisonElementString = comparison.elements?.map(
          (e) => {
            const elementDataItemsString = e.data.map((d) =>
              getComparableObjectId<ComparableObjectType, IdType>(d)).join(',');
            return elementDataItemsString;
          }).join(' vs ');

        if (otherElementValue > winningElementValue) {
          const updatedElementValue = otherElementValue ? otherElementValue + 1 : DEFAULT_ELEMENT_VALUE;
          updateObjectValue<ComparableObjectType, IdType>(
            objectValues, winningElement.data[0], updatedElementValue
          );
          const individualValues = otherElement.data.map(
            (elementData: ComparableObjectType) => getCurrentValue(objectValues, elementData)).join('+');
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
