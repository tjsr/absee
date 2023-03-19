import { ISO8601Date, SnowflakeType, UserId, uuid } from "./types";

import { CollectionTypeLoader } from "./datainfo";

export const iso8601Now = (): ISO8601Date => {
  // return (new Date()).toISOString();
  return new Date();
};

const createdWeightedRandomizerList = (max: number): number[] => {
  let current = 1;
  let output: number[] = [];

  // do {
  //   output = [...output]
  // }
  return [];
};

export const createCandidateElementList = <T>(loader: CollectionTypeLoader<T, any>, maxId: number, maxLeft?: number, maxRight?: number): [string[], string[]] => {
  const arra: string[] = [];

  let sizea = Math.floor(Math.random() * (maxLeft == undefined ? 4 : maxLeft))+1;
  while (sizea > 0) {
    let newRandom: string = getRandomId(loader.getNumberOfElements(loader)).toString();
    try {
      // ensure the object exists as numbers might not be sequential.
      const objectForId = loader.getObjectForId(loader.collectionData, newRandom);
    } catch (err) {
      // Re-try if the element doesn't exist in the collection.
      console.warn(`Random object id selector picked an id ${newRandom} that doesn't exist in dataset ${loader.collectionId}`);
      continue;
    }
    if (newRandom == '0') {
      continue;
    }
    if (!arra.includes(newRandom)) {
      arra.push(newRandom);
      sizea--;
    }
  }

  const arrb: string[] = [];
  let sizeb = Math.floor(Math.random() * (maxRight == undefined ? 4 : maxRight))+1;
  while (sizeb > 0) {
    let newRandom: string = getRandomId(loader.getNumberOfElements(loader)).toString();
    try {
      // ensure the object exists as numbers might not be sequential.
      const objectForId = loader.getObjectForId(loader.collectionData, newRandom);
    } catch (err) {
      // Re-try if the element doesn't exist in the collection.
      console.warn(`Random object id selector picked an id ${newRandom} that doesn't exist in dataset ${loader.collectionId}`);
      continue;
    }
    if (newRandom == '0') {
      continue;
    }
    if (!arra.includes(newRandom) && !arrb.includes(newRandom)) {
      arrb.push(newRandom);
      sizeb--;
    }
  }
  return [arra, arrb];
};

const getValues = (elements: number): any[] => {
  let arr: any[] = [];
  for (let i = 1;i <= elements;i++) {
    arr.push({ id: i });
  }
  return arr;
};

const COMPARABLE_OBJECTS:any[] = getValues(64);

export const getRandomId = (max?: number): number => {
  if (!max) {
    return Math.floor(Math.random() * COMPARABLE_OBJECTS.length);  
  }
  return Math.floor(Math.random() * max!);
};

