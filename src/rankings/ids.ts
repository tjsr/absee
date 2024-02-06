import { CollectionObjectType } from '../types.js';

export const getComparableObjectId = <CO extends CollectionObjectType<IdType>,
  IdType>(object: CO): IdType => {
  return object.id;
};
