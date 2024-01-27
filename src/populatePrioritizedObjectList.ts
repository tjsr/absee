import { CollectionTypeLoader } from './datainfo.js';
import { retrieveObjectFrequency } from './database/retrieveObjectFrequency.js';

export const populatePrioritizedObjectList = async <T, D>(loader: CollectionTypeLoader<T, D>): Promise<void> => {
  const frequencyList: Map<string, number> = await retrieveObjectFrequency(loader.collectionId);
  const occurenceNumberValues = frequencyList.values();
  let maxOccurrences = 0;
  for (const value of occurenceNumberValues) {
    if (value > maxOccurrences) {
      maxOccurrences = value;
    }
  }
  const workingOccurences: string[] = [];
  for (let i = loader.getNumberOfElements(loader)-1;i >= 0;i--) {
    const objectForIndex: T = loader.getObjectByIndex((loader as CollectionTypeLoader<T, any>).collectionData, i);
    const objectId = loader.getObjectId(objectForIndex);
    const instances = maxOccurrences - (frequencyList.get(objectId)?? 0);
    for (let i = 1;i <= instances;i++) {
      workingOccurences.push(objectId);
    }
  }

  workingOccurences.sort(() => Math.random() - 0.5);
  loader.prioritizedObjectIdList = workingOccurences;
};
