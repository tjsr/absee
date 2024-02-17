import { CollectionObject, CollectionObjectId } from '../types.js';

export const getComparableObjectId = <CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId>(collectionObject: CollectionObjectType): IdType => {
  return collectionObject.id;
};
