import { PinpanionV2PAX, Pin, PinIdType, PinpanionDevData, PinpanionPin, PinSet } from "./pinpanionV2types.js";
import events from './eventnames.json' assert { type: 'json' };

import { CollectionTypeLoader } from "../datainfo.js";
import { PinCollectionDataValidationError, verifyBaseImageUrl } from "./pinpanionShared.js";
import { CollectionIdType } from "../types.js";

const PIN_LIST_URL =
  process.env.PIN_LIST_URL || 'https://dev.pinpanion.com/pins.json';
const PINPANION_IMAGE_LOCATION = process.env.PIN_IMAGE_LOCATION || 'https://dev.pinpanion.com/imgs';

let paxs: PinpanionV2PAX[] | undefined = undefined;
let sets: PinSet[] | undefined = undefined;

const convertPaxIdToPaxName = (paxId: number): string => {
  const pax: PinpanionV2PAX | undefined = paxs?.find((p) => p.id.toString() === paxId?.toString());
  return pax ? pax.name : 'Unknown';
};

const convertToDisplayPin = (pin: PinpanionPin, baseImageUrl: string): Pin => {
  if (!baseImageUrl) {
    throw new Error('baseImageUrl is not set and is mandatory to convert display pin data.');
  }
  const cssClass: string | undefined = events.find(
    (e) => e.id == pin.pax_id
  )?.cssClass;
  const fullPinImageUrl = `${baseImageUrl}/${pin.image_name.split('?')[0]}`;

  const output: Pin = {
    cssClass: cssClass !== undefined ? cssClass : 'unknown',
    id: pin.id, // parseInt(pin.id),
    imageUrl: fullPinImageUrl,
    name: pin.name,
    paxId: pin.pax_id,
    paxName: convertPaxIdToPaxName(pin.pax_id),
    year: pin.year,
  };
  if (pin.set_id) {
    output.setName = getPinSetName(pin.set_id);
    output.setId = pin.set_id;
  }
  return output;
};

const getPinById = (
  sourceData: PinpanionDevData,
  id: string
): PinpanionPin | undefined => {
  if (sourceData.baseImageUrl === undefined) {
    throw new Error('baseImageUrl in V2 getPinById sourceData is undefined and is required to location images data.');
  }

  return sourceData.pins?.find((p: PinpanionPin) => p.id.toString() === id?.toString());
};

const getObjectForId = (sourceData: PinpanionDevData, id: PinIdType): Pin => {
  const sourcePin: PinpanionPin | undefined = getPinById(sourceData, id.toString());

  if (sourcePin) {
    return convertToDisplayPin(sourcePin, sourceData.baseImageUrl);
  }
  throw new Error(`Couldn't find pin for (${typeof id}) id [${id}]`);
};

const getPinSetName = (setId: number): string | undefined => {
  const set: PinSet | undefined = sets?.find((ps) => ps.id?.toString() === setId?.toString());
  if (set) {
    return set.name;
  }
  return undefined;
};

const getObjectId = (pin: Pin): PinIdType => pin.id;

const datasourceConvertor = <PinpanionData>(inputData: PinpanionDevData): PinpanionData => {
  paxs = inputData.pax;
  sets = inputData.sets;
  const output = {
    ...inputData,
    baseImageUrl: inputData.baseImageUrl || PINPANION_IMAGE_LOCATION,
  };
  return output as PinpanionData;
};

export const countPinsInCollection = (
  currentLoader: CollectionTypeLoader<PinIdType, Pin, PinpanionDevData>
): number => {
  if (currentLoader.collectionData) {
    return currentLoader.collectionData.pins.length;
  }

  return 0;
};

const getPPV2ObjectByIndex = (
  sourceData: PinpanionDevData,
  index: number,
  collectionId: CollectionIdType,
  collectionName: string
): Pin => {
  verifyBaseImageUrl(sourceData.baseImageUrl, collectionId, collectionName);
  return convertToDisplayPin(sourceData.pins[index], sourceData.baseImageUrl);
};

export const validateV2PinCollectionData = (
  collectionId: CollectionIdType,
  collectionName: string,
  collectionData: PinpanionDevData|undefined
): boolean => {
  if (collectionData === undefined) {
    throw new PinCollectionDataValidationError(collectionId, 'Pin collection data not yet loaded for collection ' + collectionName);
  }

  return verifyBaseImageUrl(collectionData.baseImageUrl, collectionId, collectionName);
};

export const defaultDevPinLoader: CollectionTypeLoader<PinIdType, Pin, PinpanionDevData> = {
  collectionData: undefined,
  collectionId: '83fd0b3e-dd08-4707-8135-e5f138a43f00',
  convertDatasourceOnLoad: datasourceConvertor,
  datasourceUrl: PIN_LIST_URL,
  getNumberOfElements: countPinsInCollection,
  getObjectByIndex: getPPV2ObjectByIndex,
  getObjectForId: getObjectForId,
  getObjectId: getObjectId,
  maxElementsPerComparison: 3,
  name: 'pinpanion_dev',
  validateData: validateV2PinCollectionData,
};

