import { Collection, PrismaClient } from "@prisma/client";
import { CollectionObject, CollectionObjectId } from "../types.js";

import { CollectionTypeLoader } from "../datainfo.js";
import { NoLoaderDefinedError } from "../types/errors.js";
import { predefinedLoaders } from "../types/loaders.js";

export interface LoaderDataSource<
  IdType extends CollectionObjectId = CollectionObjectId,
  CollectionObjectType extends CollectionObject<IdType> = CollectionObject<IdType>,
  DataType = any,
  Loader extends CollectionTypeLoader<IdType, CollectionObjectType, DataType> = CollectionTypeLoader<IdType, CollectionObjectType, DataType>,
> {
  getAll(): Promise<Loader[]>;
  getById(id: string): Promise<Loader | null>;
}

const isEmpty = (value: string|undefined): boolean => {
  return value === undefined || value.trim() === '';
};

export class LoaderPrismaDataSource<
  IdType extends CollectionObjectId = CollectionObjectId,
  CollectionObjectType extends CollectionObject<IdType> = CollectionObject<IdType>,
  DataType = any,
  Loader extends CollectionTypeLoader<IdType, CollectionObjectType, DataType> = CollectionTypeLoader<IdType, CollectionObjectType, DataType>,
> implements LoaderDataSource<IdType, CollectionObjectType, DataType, Loader> {
  _prisma: PrismaClient;
  constructor(client: PrismaClient) {
    this._prisma = client;
  }

  createLoaderFromCollection = (collection: Collection): Loader => { // CollectionTypeLoader<CollectionObjectId, any, any> => {
    // type LoaderType = CollectionTypeLoader;
    // const predefinedLoader: Loader | undefined = predefinedLoaders.get(collection.collectionId) || predefinedLoaders.get(collection.name);

    const predefinedLoader: CollectionTypeLoader<CollectionObjectId, any, any> | undefined = predefinedLoaders.get(collection.collectionId) || predefinedLoaders.get(collection.name);
    if (predefinedLoader === undefined) {
      throw new NoLoaderDefinedError(collection.name, collection.collectionId);
    }
    const data = isEmpty(collection.cachedData) ? undefined : JSON.parse(collection.cachedData);
    const loader: Loader = {
      ...predefinedLoader,
      collectionData: data,
      collectionId: collection.collectionId,
      datasourceUrl: collection.datasource,
      maxElementsPerComparison: collection.maxElementsPerComparison,
      name: predefinedLoader?.name || collection.name,
    } as unknown as Loader;

    // if (!loader!.collectionData) {
    //   if (loader.datasourceUrl === undefined) {
    //     throw new Error(`Can't loader datasource for collection ${loader.collectionId}
    //       (${loader.name}) because url is undefined.`);
    //   }
    //   return initializeLoader<IdType, CollectionObjectType, DataType>(loader!).then(() => {
    //     if (!loader.validateData(loader.collectionId, loader.name, loader.collectionData)) {
    //       throw new CollectionDataValidationError(loader.collectionId, 'Unknown error validating collection data');
    //     }
    //     return loader!;
    //   });
    // }
    return loader;
  }

  async getAll(): Promise<Loader[]> {
    return this._prisma.collection
      .findMany()
      .then((collections: Collection[]) => {
        return Promise.all(
          collections.map((collection) => {
            return this.createLoaderFromCollection(collection);
          })
        );
      });
  }

  async getById(id: string): Promise<Loader|null> {
    return this._prisma.collection.findUnique({
      where: {
        collectionId: id,
      },
    }).then((collection) => {
      return collection ? this.createLoaderFromCollection(collection) : null;
    });
  }
}
