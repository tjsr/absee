import { ClientCollectionType, CollectionIdType, CollectionObject, CollectionObjectId } from '../types.js';
import { PAX, PinpanionData } from './pinpanionTypes.js';

import { CollectionTypeLoader } from '../datainfo.js';
import { PinCollectionDataValidationError } from './pinpanionShared.js';
import events from './eventnames.json' assert { type: 'json' };

const PIN_LIST_URL =
  process.env.PIN_LIST_URL || 'https://pinpanion.com/pins.json';

let paxs: PAX[] | undefined = undefined;
let sets: PinSet[] | undefined = undefined;
let pins: PinpanionPin[] | undefined = undefined;

export type PinIdType = CollectionObjectId;

type PinpanionPin = {
  id: string;
  name: string;
  set_id: number | null;
  sub_set_id: number | null;
  year: number;
  pax_id: number;
  alternate: string;
  image_name: string;
};

export interface Pin extends CollectionObject<PinIdType> {
  id: PinIdType;
  name: string;
  year: number;
  paxName?: string;
  imageUrl: string;
  setName?: string|undefined;
  paxId: number;
  setId?: number;
  cssClass: string;
}

export type PinSet = {
  id: number;
  name: string;
  year: number;
};

type LowercasePaxShortname = string;

export type PninpanionV1PAX = {
  shortName: LowercasePaxShortname;
} & PAX;

type PinpanionV1ProdData = {
  pins: PinpanionPin[];
  pax: PAX[];
  sets: PinSet[];
} & PinpanionData;

export const countPinsInCollection = (
  currentLoader: CollectionTypeLoader<PinIdType, Pin, PinpanionV1ProdData>
): number => {
  if (currentLoader.collectionData) {
    return currentLoader.collectionData.pins.length;
  }

  return 0;
};

const convertPaxIdToPaxName = (paxId: number): string => {
  const pax: PAX | undefined = paxs?.find((p) => p.id.toString() === paxId?.toString());
  return pax ? pax.name : 'Unknown';
};

const getPinSetName = (setId: number): string | undefined => {
  const set: PinSet | undefined = sets?.find((ps) => ps.id?.toString() === setId?.toString());
  if (set) {
    return set.name;
  }
  return undefined;
};

const getObjectId = (pin: Pin): PinIdType => pin.id;

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

const getObjectByIndex = (
  sourceData: PinpanionV1ProdData,
  index: number
): Pin => {
  if (sourceData.baseImageUrl === undefined) {
    const err = new Error('baseImageUrl in V1 sourceData is undefined and is required to location images data.');
    console.debug(getObjectByIndex, 'v1', 'baseImageUrl is undefined', err);
    throw err;
  }
  return convertToDisplayPin(sourceData.pins[index], sourceData.baseImageUrl);
};

const getPinById = (
  sourceData: PinpanionV1ProdData,
  id: string
): PinpanionPin | undefined => {
  if (sourceData.baseImageUrl === undefined) {
    const err = new Error('baseImageUrl in V1 sourceData is undefined and is required to location images data.');
    console.debug(getPinById, 'v1', 'baseImageUrl is undefined', err);
    throw err;
  }

  return sourceData.pins?.find((p: PinpanionPin) => p.id.toString() === id?.toString());
};

const getObjectForId = (sourceData: PinpanionV1ProdData, id: PinIdType): Pin => {
  const sourcePin: PinpanionPin | undefined = getPinById(sourceData, id.toString());

  if (sourcePin) {
    return convertToDisplayPin(sourcePin, sourceData.baseImageUrl);
  }
  throw new Error(`Couldn't find pin for (${typeof id}) id [${id}]`);
};

const datasourceConvertor = <PinpanionData>(inputData: PinpanionV1ProdData): PinpanionData => {
  paxs = inputData.pax;
  pins = inputData.pins;
  sets = inputData.sets;
  return {
    ...inputData,
    paxs,
    pins,
    sets,
  } as PinpanionData;
};

export const validateV1PinCollectionData = (
  collectionId: CollectionIdType,
  collectionName: string,
  collectionData: PinpanionV1ProdData|undefined
): boolean => {
  if (collectionData === undefined) {
    throw new PinCollectionDataValidationError(collectionId,
      'Pin collection data not yet loaded for collection ' + collectionName);
  }


  return true;
  // verifyBaseImageUrl(collectionData, collectionId, collectionName);
};

export const defaultProdPinpanionLoader: CollectionTypeLoader<PinIdType, Pin, PinpanionV1ProdData> = {
  collectionData: undefined,
  collectionId: 'bbd20717-662c-4eb4-8809-a75d2bb320d2',
  convertDatasourceOnLoad: datasourceConvertor,
  datasourceUrl: PIN_LIST_URL,
  getNumberOfElements: countPinsInCollection,
  getObjectByIndex: getObjectByIndex,
  getObjectForId: getObjectForId,
  getObjectId: getObjectId,
  maxElementsPerComparison: 3,
  name: 'pinpanion_dev',
  validateData: validateV1PinCollectionData,
};

export const clientPinLoader: ClientCollectionType<PinIdType, Pin> = {
  getObjectId: getObjectId,
};
