import { CollectionObject } from '../types.js';

export const getComparableObjectId = <T extends CollectionObject<IdType>,
  IdType>(object: T): IdType => {
  return object.id;
};
