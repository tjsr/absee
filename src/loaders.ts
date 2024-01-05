import { CollectionTypeData, retrieveCollections } from './database/mysql';
import { CollectionTypeLoader, initializeLoader } from './datainfo';

import { CollectionIdType } from './types';
import { defaultDevPinLoader } from '../src/pins/pinpanion';

// import { loader as pinLoader } from '../src/pins/pinpanion';

const predefinedLoaders = new Map<string, CollectionTypeLoader<any, any>>();
predefinedLoaders.set('pinpanion', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade_dev', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade', defaultDevPinLoader);
predefinedLoaders.set(defaultDevPinLoader.collectionId, defaultDevPinLoader);
let allLoaders: CollectionTypeLoader<any, any>[]; // = undefined; //await retrieveCollections();// pinLoader];

export const getLoader = async <ComparableElementType, DataList>(id: CollectionIdType):
  Promise<CollectionTypeLoader<ComparableElementType, DataList>> => {
  if (allLoaders === undefined) {
    allLoaders = [];
    const loaderData: CollectionTypeData[] = await retrieveCollections();
    loaderData.map((loader: CollectionTypeData) => {
      const predefinedLoader = predefinedLoaders.get(loader.collectionId) || predefinedLoaders.get(loader.name);
      if (predefinedLoader === undefined) {
        throw new Error(`No predefined loader for data type ${loader.name} (${loader.collectionId})`);
      }
      const outputLoader: CollectionTypeLoader<ComparableElementType, DataList> = {
        ...predefinedLoader,
        collectionData: loader.cachedData?.trim() === '' ? undefined : JSON.parse(loader.cachedData),
        collectionId: loader.collectionId,
        datasourceUrl: loader.datasource,
        maxElementsPerComparison: loader.maxElementsPerComparison,
      };
      predefinedLoaders.set(loader.collectionId, outputLoader);
      allLoaders.push(outputLoader);
    });
  }

  const loader: CollectionTypeLoader<ComparableElementType, DataList>|undefined =
    allLoaders.find((l) => l.collectionId === id);

  if (loader === undefined) {
    throw new Error(`No loader found for id ${id}`);
  }

  if (!loader!.collectionData) {
    if (loader.datasourceUrl === undefined) {
      throw new Error(`Can't loader datasource for collection ${loader.collectionId}
        (${loader.name}) because url is undefined.`);
    }
    await initializeLoader(loader!);
  }
  return loader!;
};
