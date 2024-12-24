import { CollectionObject, CollectionObjectId, DatabaseConnection } from './types.js';

import { CollectionTypeLoader } from './datainfo.js';
import { retrieveObjectFrequency } from './database/retrieveObjectFrequency.js';

export const populatePrioritizedObjectList = async <
CollectionObjectType extends CollectionObject<IdType>, DataType, IdType extends CollectionObjectId>(
  conn: DatabaseConnection,
  loader: CollectionTypeLoader<IdType, CollectionObjectType, DataType>): Promise<void> => {
  if (!loader.collectionData) {
    throw new Error('Collection data must be loaded before prioritized object list can be populated');
  }
  const frequencyList: Map<string, number> = await retrieveObjectFrequency(conn, loader.collectionId);
  const occurenceNumberValues = frequencyList.values();
  let maxOccurrences = 0;
  for (const value of occurenceNumberValues) {
    if (value > maxOccurrences) {
      maxOccurrences = value;
    }
  }
  const workingOccurences: IdType[] = [];
  for (let i = loader.getNumberOfElements(loader)-1;i >= 0;i--) {
    const objectForIndex: CollectionObjectType = loader.getObjectByIndex(
      (loader as CollectionTypeLoader<IdType, CollectionObjectType, DataType>).collectionData!,
      i,
      loader.collectionId,
      loader.name
    );
    const objectId = loader.getObjectId(objectForIndex);
    const instances = maxOccurrences - (frequencyList.get(objectId)?? 0);
    for (let i = 1;i <= instances;i++) {
      workingOccurences.push(objectId);
    }
  }

  workingOccurences.sort(() => Math.random() - 0.5);
  loader.prioritizedObjectIdList = workingOccurences;
};
