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

export interface CollectionTypeLoader<
  IdType extends CollectionObjectId = CollectionObjectId,
  CollectionObjectType extends CollectionObject<IdType> = CollectionObject<IdType>,
  ProcessedCollectionData = any,
  InputData = any
> {
  collectionId: CollectionIdType;
  datasourceUrl: string;
  collectionData: ProcessedCollectionData | undefined;
  maxElementsPerComparison: number;
  name: string;
  getNumberOfElements: (loader: CollectionTypeLoader<IdType, CollectionObjectType, ProcessedCollectionData>) => number;
  // defaultElementCounter;
  convertDatasourceOnLoad: <D>(data: InputData) => D;
  getObjectForId: (collectionData: ProcessedCollectionData, id: IdType, collectionId?: CollectionIdType, collectionName?: string) => CollectionObjectType;
  getObjectByIndex: (collectionData: ProcessedCollectionData, index: number, collectionId: CollectionIdType, collectionName: string) => CollectionObjectType;
  getObjectId: (object: CollectionObjectType) => IdType;
  validateData: (collectionId: CollectionIdType, collectionName: string, collectionData: ProcessedCollectionData|undefined) => boolean;
  prioritizedObjectIdList?: IdType[] | undefined;
};

export const initializeLoader = async <
IdType extends CollectionIdType,
CollectionObjectType extends CollectionObject<IdType>,
DataType = any>(
  loader: CollectionTypeLoader<IdType, CollectionObjectType, DataType>
): Promise<DataType> => {
  return retrieveCollectionData(
      loader.collectionData,
      loader.datasourceUrl,
      loader.convertDatasourceOnLoad
    )
    .then((data: DataType) => {
      loader.collectionData = data;
      return data;
    });
};

export const dataFromLoader = <
  IdType extends CollectionIdType,
  CollectionObjectType extends CollectionObject<IdType>,
  DataType
>(
    loader: CollectionTypeLoader<IdType, CollectionObjectType, DataType>): DataType => {
  return loader.collectionData!;
};
