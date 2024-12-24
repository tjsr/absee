import { CollectionDataValidationError, CollectionTypeLoader } from "../datainfo.js";

import { CollectionIdType } from "../types.js";
import { PinpanionData } from "./pinpanionTypes.js";
import { loaderDataSummary } from "../utils.js";

export class PinCollectionDataValidationError extends CollectionDataValidationError {
  constructor(collectionId: string, errorMessage: string) {
    super(collectionId, errorMessage);
  }
}

export class PinCollectionImageBaseUrlMissing extends PinCollectionDataValidationError {
  constructor(collectionId: string, collectionName: string) {
    super(collectionId, 'No URL for pin image locations provided on collection ' + collectionName);
  }
}

export const verifyLoaderBaseImageUrl = (
  loader: CollectionTypeLoader<CollectionIdType, any, PinpanionData>
): boolean => {
  const collectionData = loader.collectionData as PinpanionData;
  const collectionId = loader.collectionId;
  const collectionName = loader.name;
  try {
    return verifyBaseImageUrl(collectionData?.baseImageUrl, collectionId, collectionName);
  } catch (err) {
    const summary = loaderDataSummary(collectionData);
    console.warn(verifyLoaderBaseImageUrl, collectionId, collectionName,
      'When validating pin collection', summary);
    throw err;
  }
};

export const verifyBaseImageUrl = (
  baseImageUrl: string, collectionId: CollectionIdType, collectionName: string
): boolean => {
  if (!baseImageUrl) {
    throw new PinCollectionImageBaseUrlMissing(collectionId, collectionName);
  }
  return true;
};