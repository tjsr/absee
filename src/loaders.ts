import { CollectionTypeLoader, initializeLoader } from './datainfo';

import { CollectionIdType } from './types';
import { loader as pinLoader } from '../src/pins/pinpanion';

const allLoaders: CollectionTypeLoader<any, any>[] = [pinLoader];

export const getLoader = async <ComparableElementType, DataList>(id: CollectionIdType):
  Promise<CollectionTypeLoader<ComparableElementType, DataList>> => {
  const loader: CollectionTypeLoader<ComparableElementType, DataList>|undefined =
    allLoaders.find((l) => l.collectionId === id);
  if (loader === undefined) {
    throw new Error(`No loader found for id ${id}`);
  }
  if (!loader.collectionData) {
    await initializeLoader(loader);
  }
  return loader;
};
