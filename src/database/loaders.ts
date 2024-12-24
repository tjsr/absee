import { CollectionDataValidationError, CollectionTypeLoader, initializeLoader } from "../datainfo.js";
import { CollectionIdType, CollectionObject, CollectionObjectId, DatabaseConnection } from "../types.js";

import { CollectionTypeData } from "./mysql.js";
import { LoaderNotFoundError } from "../types/errortypes.js";
import { _retrieveCollections } from "./collections.js";
import { createLoaderFromCollection } from "../loaders.js";
import { predefinedLoaders } from "../types/loaders.js";

export let allLoaders: CollectionTypeLoader<any, any, any>[];

/**
 * @deprecated Use initialiseLoadersFromPrisma
 */
// ts-ignore-next-line(TS6133)
const _initialiseLoadersFromDatabase = async (useConn: DatabaseConnection):
  Promise<CollectionTypeLoader<any, any, any>[]> => {
  const loaderList:CollectionTypeLoader<any, any, any>[] = [];
  const loaderData: CollectionTypeData[] = await _retrieveCollections(useConn);
  loaderData.map((loader: CollectionTypeData) => {
    const outputLoader = createLoaderFromCollection(loader);
    predefinedLoaders.set(loader.collectionId, outputLoader);
    loaderList.push(outputLoader);
  });
  return loaderList;
};

/**
 * @deprecated Use getLoaderFromPrisma instead
 */
export const _getLoaderFromDatabase = async <CollectionObjectType extends CollectionObject<IdType>,
  DataList, IdType extends CollectionObjectId>(useConn: DatabaseConnection, id: CollectionIdType):
  Promise<CollectionTypeLoader<IdType, CollectionObjectType, DataList>> => {
  if (allLoaders === undefined) {
    allLoaders = await _initialiseLoadersFromDatabase(useConn);
  }

  const loader: CollectionTypeLoader<IdType, CollectionObjectType, DataList>|undefined =
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
    return initializeLoader(loader!).then((_data) => {
      return loader!;
    });
  }
  return loader!;
};
