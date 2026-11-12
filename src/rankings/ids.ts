import { CollectionObject, CollectionObjectId } from '../types.ts';

export const getComparableObjectId = <CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId>(collectionObject: CollectionObjectType): IdType => {
  return collectionObject.id;
};
