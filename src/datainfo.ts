import { CollectionIdType, CollectionObject, CollectionObjectId } from './types.js';

import axios from 'axios';

export const retrieveCollectionData = async <D>(
  existingData: D | undefined,
  url: string,
  datasourceConvertor: <D>(data: any) => D
): Promise<D> => {
  return new Promise((resolve, reject) => {
    if (existingData == undefined) {
      // TODO: Swap axios with fetch
      axios.get(url).then((data) => {
        try {
          resolve(datasourceConvertor(data.data));
        } catch (err) {
          reject(err);
        }
      });
    } else {
      resolve(existingData);
    }
  });
};

// type IdType = string;

export class CollectionDataValidationError extends Error {
  private _collectionId: CollectionIdType;
  constructor(collectionId: CollectionIdType, errorMessage: string) {
    super(`Collection data for ${collectionId} is invalid: ${errorMessage}.`);
    this._collectionId = collectionId;
  }

  get collectionId(): CollectionIdType {
    return this._collectionId;
  }
}

export type CollectionTypeLoader<
CollectionObjectType extends CollectionObject<IdType>, D, IdType extends CollectionObjectId> = {
  collectionId: CollectionIdType;
  datasourceUrl: string;
  collectionData: D | undefined;
  maxElementsPerComparison: number;
  name: string;
  getNumberOfElements: (loader: CollectionTypeLoader<CollectionObjectType, D, IdType>) => number;
  // defaultElementCounter;
  convertDatasourceOnLoad: <D>(data: any) => D;
  getObjectForId: (collectionData: D, id: IdType) => CollectionObjectType;
  getObjectByIndex: (collectionData: D, index: number) => CollectionObjectType;
  getObjectId: (object: CollectionObjectType) => IdType;
  validateData: (collectionId: CollectionIdType, collectionName: string, collectionData: D|undefined) => boolean;
  prioritizedObjectIdList?: IdType[];
};

export const initializeLoader = async <
CollectionObjectType extends CollectionObject<IdType>, D, IdType extends CollectionIdType>(
  loader: CollectionTypeLoader<CollectionObjectType, D, IdType>
): Promise<D> => {
  return new Promise((resolve, reject) => {
    retrieveCollectionData(
      loader.collectionData,
      loader.datasourceUrl,
      loader.convertDatasourceOnLoad
    )
      .then((data: D) => {
        loader.collectionData = data;
        resolve(data);
      })
      .catch((err) => reject(err));
  });
};

export const dataFromLoader = <
CollectionObjectType extends CollectionObject<IdType>, D, IdType extends CollectionIdType>(
    loader: CollectionTypeLoader<CollectionObjectType, D, IdType>): D => {
  return loader.collectionData!;
};
