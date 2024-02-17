import {
  CollectionEloMap,
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonElementResponse,
  ComparisonResultResponse
} from '../types.js';

// import { getComparableObjectId } from './ids.js";
const DEFAULT_ELEMENT_VALUE = 15;

const getComparableObjectId = <CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId>(object: CollectionObjectType): IdType => {
  return object.id;
};

export const getCurrentValue = <
  CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>
  (
    objectValues: Map<CollectionObjectId, number>,
    collectionObject: CollectionObjectType
  ): number => {
  const currentValue = objectValues.get(collectionObject.id);
  if (currentValue === undefined) {
    return DEFAULT_ELEMENT_VALUE;
  }
  return currentValue;
};

export const getObjectValue = <
  CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
    objectValues: Map<IdType, number>,
    comparableObject: CollectionObjectType
  ): number|undefined => {
  const id = getComparableObjectId<CollectionObjectType, IdType>(comparableObject);
  const objectValue = objectValues.get(id);
  return objectValue;
};

export const getElementValue = <CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionIdType>
  (
    objectValues: Map<CollectionIdType, number>,
    element: ComparisonElementResponse<CollectionObjectType, IdType>
  ): number => {
  const elementRating = element.data.map(
    (elementData: CollectionObjectType) => getCurrentValue(objectValues, elementData)).reduce((acc, cur) => acc + cur);
  return elementRating;
};

export const updateObjectValue = <CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId>(
    objectValues: CollectionEloMap, comparableObject: CollectionObjectType, updatedValue: number
  ): void => {
  const objectId = getComparableObjectId<CollectionObjectType, IdType>(
    comparableObject
  );
  console.log(`Updating ${objectId} to ${updatedValue}`);
  objectValues.set(objectId, updatedValue);
};

export const calculateRelativeValues = <
CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId
> (
    objectValues: CollectionEloMap,
    recentComparisons: ComparisonResultResponse<CollectionObjectType, IdType>[]
  ) => {
  const filteredComparisons: ComparisonResultResponse<CollectionObjectType, IdType>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<CollectionObjectType, IdType>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  filteredComparisons.forEach((comparison) => {
    // const elementValues: number[] = comparison.elements?.map((element) => getElementValue(element));
    const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
    const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];
    if (winningElement && otherElement) {
      if (winningElement.data.length === 1) {
        const otherElementValue = getElementValue<CollectionObjectType, IdType>(objectValues, otherElement);
        // const otherElementValue = getObjectValue<ComparableObjectType, IdType>(otherElement.data[0]) ??
        //   DEFAULT_ELEMENT_VALUE * (otherElement.data?.length ?? 1);
        const winningElementValue = getElementValue<CollectionObjectType, IdType>(objectValues, winningElement);
        const comparisonElementString = comparison.elements?.map(
          (e) => {
            const elementDataItemsString = e.data.map((d) =>
              getComparableObjectId<CollectionObjectType, IdType>(d)).join(',');
            return elementDataItemsString;
          }).join(' vs ');

        if (otherElementValue > winningElementValue) {
          const updatedElementValue = otherElementValue ? otherElementValue + 1 : DEFAULT_ELEMENT_VALUE;
          updateObjectValue<CollectionObjectType, IdType>(
            objectValues, winningElement.data[0], updatedElementValue
          );
          const individualValues = otherElement.data.map(
            (elementData: CollectionObjectType) => getCurrentValue(objectValues, elementData)).join('+');
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
