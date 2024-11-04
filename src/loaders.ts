import { CollectionDataValidationError, CollectionTypeLoader, initializeLoader } from './datainfo.js';
import { CollectionIdType, CollectionObject, CollectionObjectId } from './types.js';
import { CollectionTypeData, retrieveCollections } from './database/mysql.js';

import { LoaderNotFoundError } from './types/errortypes.js';
import { defaultDevPinLoader } from '../src/pins/pinpanion.js';

const predefinedLoaders = new Map<string, CollectionTypeLoader<any, any, CollectionObjectId>>();
predefinedLoaders.set('pinpanion', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade_dev', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade', defaultDevPinLoader);
predefinedLoaders.set(defaultDevPinLoader.collectionId, defaultDevPinLoader);
// CollectionObjectType extends CollectionObject<IdType>, any, IdType extends CollectionObjectId
let allLoaders: CollectionTypeLoader<any, any, any>[]; // = undefined; //await retrieveCollections();// pinLoader];

export const getLoader = async <CollectionObjectType extends CollectionObject<IdType>,
DataList, IdType extends CollectionObjectId>(id: CollectionIdType):
  Promise<CollectionTypeLoader<CollectionObjectType, DataList, IdType>> => {
  if (allLoaders === undefined) {
    allLoaders = [];
    const loaderData: CollectionTypeData[] = await retrieveCollections();
    loaderData.map((loader: CollectionTypeData) => {
      const predefinedLoader = predefinedLoaders.get(loader.collectionId) || predefinedLoaders.get(loader.name);
      if (predefinedLoader === undefined) {
        console.warn(`No predefined loader for data type ${loader.name} (${loader.collectionId})`);
      } else {
        const outputLoader: CollectionTypeLoader<CollectionObject<CollectionObjectId>, DataList, CollectionObjectId> = {
          ...predefinedLoader,
          collectionData: loader.cachedData?.trim() === '' ? undefined : JSON.parse(loader.cachedData),
          collectionId: loader.collectionId,
          datasourceUrl: loader.datasource,
          maxElementsPerComparison: loader.maxElementsPerComparison,
        };
        predefinedLoaders.set(loader.collectionId, outputLoader);
        allLoaders.push(outputLoader);
      }
    });
  }

  const loader: CollectionTypeLoader<CollectionObjectType, DataList, IdType>|undefined =
    allLoaders.find((l) => l.collectionId === id);

  if (loader === undefined) {
    throw new LoaderNotFoundError(id);
  }

  if (!loader.validateData(loader.collectionId, loader.name, loader.collectionData)) {
    throw new CollectionDataValidationError(loader.collectionId, 'Unknown error validating collection data');
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
