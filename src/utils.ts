import * as EmailValidator from 'email-validator';

import { CollectionObject, CollectionObjectId, ISO8601Date } from './types.js';

import { CollectionTypeLoader } from './datainfo.js';
import { RequiredEnvError } from './types/errortypes.js';
import { loadEnv } from '@tjsr/simple-env-utils';

loadEnv();

export const iso8601Now = (): ISO8601Date => {
  // return (new Date()).toISOString();
  return new Date();
};

export const createdWeightedRandomizerList = (maxNumber: number): number[] => {
  const list: number[] = [];

  for (let i = 1; i <= maxNumber; i++) {
    for (let j = i; j <= maxNumber; j++) {
      list.push(i);
    }
  }

  return list;
};

const randomlySelectNumberOfElements = (max: number): number => {
  const list: number[] = createdWeightedRandomizerList(max);
  const randomIndex = (Math.floor(Math.random() * list.length));
  return list[randomIndex];
};

const createNewUniqueElementArray = <
  CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId
>(loader: CollectionTypeLoader<CollectionObjectType, any, IdType>,
    max?: number,
    existingSets?: string[][]): IdType[] => {
  const results: IdType[] = [];

  let listSize = randomlySelectNumberOfElements(max == undefined ? 4 : max);
  while (listSize > 0) {
    const randomObjectId: IdType = getPrioritizedOrRandomObjectId<CollectionObjectType, IdType>(loader);
    if (randomObjectId == '0') {
      continue;
    }
    if (existingSets !== undefined && existingSets.flat().includes(randomObjectId)) {
      continue;
    }
    if (results.includes(randomObjectId)) {
      continue;
    }
    results.push(randomObjectId);
    listSize--;
  }
  return results;
};

export const createCandidateElementList = <
  CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId
>(
    loader: CollectionTypeLoader<CollectionObjectType, any, IdType>,
    maxId: number,
    maxLeft?: number,
    maxRight?: number
  ): [IdType[], IdType[]] => {
  const arra: IdType[] = createNewUniqueElementArray(loader, maxLeft);
  const arrb: IdType[] = createNewUniqueElementArray(loader, maxRight, [arra]);
  return [arra, arrb];
};

const getValues = (elements: number): any[] => {
  const arr: any[] = [];
  for (let i = 1; i <= elements; i++) {
    arr.push({ id: i });
  }
  return arr;
};

const COMPARABLE_OBJECTS: any[] = getValues(64);

export const getRandomId = (max?: number): number => {
  if (!max) {
    return Math.floor(Math.random() * COMPARABLE_OBJECTS.length);
  }
  return Math.floor(Math.random() * max!);
};

export const requireEnv = (val: string): string => {
  if (process.env[val] === undefined) {
    throw new RequiredEnvError(val, `${val} environment variable not set, which is required.`);
  }
  return process.env[val] as string;
};

export const validateEmailString = (email: string): boolean => {
  return EmailValidator.validate(email);
};

const getRandomObjectId = <
CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionObjectId
>(loader: CollectionTypeLoader<CollectionObjectType, any, IdType>): IdType => {
  const randomIndex: number = getRandomId(
    loader.getNumberOfElements(loader)
  );

  const objectForIndex: CollectionObjectType = loader.getObjectByIndex(loader.collectionData, randomIndex);
  const randomObjectId: IdType = loader.getObjectId(objectForIndex);
  return randomObjectId;
};

const getPrioritizedOrRandomObjectId = <
CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionObjectId
>(loader: CollectionTypeLoader<CollectionObjectType, any, IdType>): IdType => {
  const id = loader.prioritizedObjectIdList?.pop();
  if (id) {
    return id;
  }
  return getRandomObjectId(loader);
};

