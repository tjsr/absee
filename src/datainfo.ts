import * as dotenv from 'dotenv';

import { CollectionIdType } from './types';
import axios from 'axios';

dotenv.config();

export const retrieveCollectionData = async <T, D>(
  existingData: D | undefined,
  url: string,
  datasourceConvertor: <D>(data: any) => D
): Promise<D> => {
  return new Promise((resolve, reject) => {
    if (existingData == undefined) {
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

type IdType = string;

export type CollectionTypeLoader<T, D> = {
  collectionId: CollectionIdType;
  datasourceUrl: string;
  collectionData: D | undefined;
  maxElementsPerComparison: number;
  getNumberOfElements: (loader: CollectionTypeLoader<T, D>) => number; // defaultElementCounter;
  convertDatasourceOnLoad: <D>(data: any) => D;
  getObjectForId: (collectionData: D, id: IdType) => T;
  getObjectByIndex: (collectionData: D, index: number) => T;
  getObjectId: (object: T) => string;
};

export const initializeLoader = async <T, D>(
  loader: CollectionTypeLoader<T, D>
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

export const dataFromLoader = <T, D>(loader: CollectionTypeLoader<T, D>): D => {
  return loader.collectionData!;
};
