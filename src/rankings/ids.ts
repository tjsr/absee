import { CollectionObject } from '../types.js';

export const getComparableObjectId = <CO extends CollectionObject<IdType>,
  IdType>(object: CO): IdType => {
  return object.id;
};
