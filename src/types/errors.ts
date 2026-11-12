import { CollectionIdType } from '../types.ts';

export class NoLoaderDefinedError extends Error {
  _collectionId: CollectionIdType;
  _collectionName: string;

  constructor(collectionName: string, collectionId: CollectionIdType) {
    super(`No predefined loader for data type ${collectionName} (${collectionId})`);
    this._collectionId = collectionId;
    this._collectionName = collectionName;
  }
}
