import { CollectionObjectId } from "../types.js";
import { CollectionTypeLoader } from "../datainfo.js";
import { defaultDevPinLoader } from "../pins/pinpanion.js";

export const predefinedLoaders = new Map<string, CollectionTypeLoader<CollectionObjectId, any, any>>();
predefinedLoaders.set('pinpanion', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade_dev', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade', defaultDevPinLoader);
predefinedLoaders.set(defaultDevPinLoader.collectionId, defaultDevPinLoader);
// CollectionObjectType extends CollectionObject<IdType>, any, IdType extends CollectionObjectId
