import { Collection, Prisma } from '@prisma/client';
import { CollectionDataValidationError, CollectionTypeLoader, initializeLoader } from './datainfo.js';
import { CollectionIdType, CollectionObject, CollectionObjectId } from './types.js';

import { LoaderNotFoundError } from './types/errortypes.js';
import { NoLoaderDefinedError } from './types/errors.js';
import { _retrieveCollections } from './database/collections.js';
import { predefinedLoaders } from './types/loaders.js';

export let allLoaders: CollectionTypeLoader<any, any, any>[];

export const getLoaderFromPrisma = async (
  collections: Prisma.CollectionDelegate, collectionId: CollectionIdType
): Promise<CollectionTypeLoader<any, any, any>> => {
  if (allLoaders === undefined) {
    allLoaders = await initialiseLoadersFromPrisma(collections);
  }

  return collections.findUnique({
    where: {
      collectionId: collectionId,
    },
  }).then((collection) => {
    if (collection === undefined) {
      throw new LoaderNotFoundError(collectionId);
    }

    const loader: CollectionTypeLoader<any, any, any>|undefined = allLoaders.find(
      (l) => l.collectionId === collectionId
    );
  
    if (loader === undefined) {
      throw new LoaderNotFoundError(collectionId);
    }

    if (!loader.validateData(loader.collectionId, loader.name, loader.collectionData)) {
      throw new CollectionDataValidationError(loader.collectionId, 'Unknown error validating collection data');
    }
    if (!loader!.collectionData) {
      if (loader.datasourceUrl === undefined) {
        throw new Error(`Can't loader datasource for collection ${loader.collectionId}
          (${loader.name}) because url is undefined.`);
      }
      return initializeLoader(loader!).then(() => loader!);
    }
    return loader!
    });
};

export const createLoaderFromCollection = <
  CollectionObjectType extends CollectionObject<IdType>,
  DataList, IdType extends CollectionObjectId
  >(collection: Collection): CollectionTypeLoader<
    CollectionObjectId, CollectionObjectType, DataList
  > => {
  const predefinedLoader = predefinedLoaders.get(collection.collectionId) || predefinedLoaders.get(collection.name);
  if (predefinedLoader === undefined) {
    throw new NoLoaderDefinedError(collection.name, collection.collectionId);
  }
  const outputLoader: CollectionTypeLoader<CollectionObjectId, CollectionObjectType, DataList> = {
    ...predefinedLoader,
    collectionData: collection.cachedData?.trim() === '' ? undefined : JSON.parse(collection.cachedData),
    collectionId: collection.collectionId,
    datasourceUrl: collection.datasource,
    maxElementsPerComparison: collection.maxElementsPerComparison,
    name: predefinedLoader?.name || collection.name,
  };
  return outputLoader;
};

const initialiseLoadersFromPrisma = async (collections: Prisma.CollectionDelegate): Promise<CollectionTypeLoader<any, any, any>[]> => {
  const loaderList:CollectionTypeLoader<any, any, any>[] = [];
  const allCollections = collections.findMany();
  await allCollections.then((result: Collection[]) => {
    result.map((collection) => {
      const outputLoader = createLoaderFromCollection(collection);
      predefinedLoaders.set(outputLoader.collectionId, outputLoader);
      loaderList.push(outputLoader);
    });
  });
  return loaderList;
};
