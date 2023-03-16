import * as dotenv from 'dotenv';

import axios from "axios";

dotenv.config();

export const retrieveCollectionData = async<T>(existingData: T[]|undefined, url: string, resultDataConvertor: <T>(data: any) => T[]): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    if (existingData == undefined) {
      axios.get(url).then((data) => {
        try {
          resolve(resultDataConvertor(data));
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

export type CollectionTypeLoader<T> = {
  datasourceUrl: string;
  // retrieveCollectionData: <T>() => Promise<T[]>;
  // retrieveCachedCollectionData: <T>() => T[];
  existingData: T[] | undefined;
  resultDataConvertor: <T>(data: any) => T[];
  getObjectForId: <T>(existingData: T[], id: IdType) => T;
};

export const initializeLoader = async <T>(loader: CollectionTypeLoader<T>): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    retrieveCollectionData(loader.existingData, loader.datasourceUrl, loader.resultDataConvertor).then((data:T[]) => {
      loader.existingData = data;
      resolve(data);
    }).catch((err) => reject(err));
  });
};

export const dataFromLoader = <T>(loader: CollectionTypeLoader<T>): T[] => {
  return loader.existingData!;
};
