import { CollectionObjectId } from "../types.js";
import { CollectionTypeLoader } from "../datainfo.js";
import { defaultDevPinLoader } from "../pins/pinpanionV2.js";
import { defaultProdPinpanionLoader } from "../pins/pinpanionV1.js";

export const predefinedLoaders = new Map<string, CollectionTypeLoader<CollectionObjectId, any, any>>();
predefinedLoaders.set('pinpanion', defaultProdPinpanionLoader);
predefinedLoaders.set('pinnyarcade_dev', defaultDevPinLoader);
predefinedLoaders.set('pinnyarcade', defaultProdPinpanionLoader);
predefinedLoaders.set(defaultDevPinLoader.collectionId, defaultDevPinLoader);
// CollectionObjectType extends CollectionObject<IdType>, any, IdType extends CollectionObjectId
