import * as EmailValidator from 'email-validator';

import { CollectionTypeLoader } from './datainfo';
import { ISO8601Date } from './types';

export const iso8601Now = (): ISO8601Date => {
  // return (new Date()).toISOString();
  return new Date();
};

const createdWeightedRandomizerList = (max: number): number[] => {
  const current = 1;
  const output: number[] = [];

  // do {
  //   output = [...output]
  // }
  return [];
};

const createNewUniqueElementArray = <T>(loader: CollectionTypeLoader<T, any>,
  max?: number,
  existingSets?: string[][]): string[] => {
  const results: string[] = [];

  let sizea =
    Math.floor(Math.random() * (max == undefined ? 4 : max)) + 1;
  while (sizea > 0) {
    const randomObjectId: string = getRandomObjectId<T>(loader);
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
    sizea--;
  }
  return results;
};

export const createCandidateElementList = <T>(
  loader: CollectionTypeLoader<T, any>,
  maxId: number,
  maxLeft?: number,
  maxRight?: number
): [string[], string[]] => {
  const arra: string[] = createNewUniqueElementArray(loader, maxLeft);
  const arrb: string[] = createNewUniqueElementArray(loader, maxRight, [arra]);
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
    throw Error(`${val} environment variable not set, which is required.`);
  }
  return process.env[val] as string;
};

export const validateEmailString = (email: string): boolean => {
  return EmailValidator.validate(email);
};
function getRandomObjectId<T>(loader: CollectionTypeLoader<T, any>) {
  const randomIndex: number = getRandomId(
    loader.getNumberOfElements(loader)
  );

  const objectForIndex: T = loader.getObjectByIndex(loader.collectionData, randomIndex);
  const randomObjectId: string = loader.getObjectId(objectForIndex);
  return randomObjectId;
}

