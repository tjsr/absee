import { ClientCollectionType, CollectionIdType, CollectionObject, CollectionObjectId } from '../types.js';

import { CollectionDataValidationError, CollectionTypeLoader } from '../datainfo.js';
import events from './eventnames.json' assert { type: 'json' };

const PIN_LIST_URL =
  process.env.PIN_LIST_URL || 'https://pinpanion.com/pins.json';

let paxs: PAX[] | undefined = undefined;
let sets: PinSet[] | undefined = undefined;

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

export type PAX = {
  id: number;
  name: string;
};

type PinpanionData = {
  categories: any[];
  sets: any[];
  events: any[];
  pins: PinpanionPin[];
  paxs: PAX[];
  success: boolean;
  baseImageUrl: string;
};

export const countPinsInCollection = (
  currentLoader: CollectionTypeLoader<PinIdType, Pin, PinpanionData>
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
  sourceData: PinpanionData,
  index: number
): Pin => {
  if (sourceData.baseImageUrl === undefined) {
    throw new Error('baseImageUrl in sourceData is undefined and is required to location images data.');
  }
  return convertToDisplayPin(sourceData.pins[index], sourceData.baseImageUrl);
};

const getPinById = (
  sourceData: PinpanionData,
  id: string
): PinpanionPin | undefined => {
  if (sourceData.baseImageUrl === undefined) {
    throw new Error('baseImageUrl in sourceData is undefined and is required to location images data.');
  }

  return sourceData.pins?.find((p: PinpanionPin) => p.id.toString() === id?.toString());
};

const getObjectForId = (sourceData: PinpanionData, id: PinIdType): Pin => {
  const sourcePin: PinpanionPin | undefined = getPinById(sourceData, id.toString());

  if (sourcePin) {
    return convertToDisplayPin(sourcePin, sourceData.baseImageUrl);
  }
  throw new Error(`Couldn't find pin for (${typeof id}) id [${id}]`);
};

const datasourceConvertor = <PinpanionData>(inputData: any): PinpanionData => {
  paxs = inputData.pax;
  sets = inputData.sets;
  return inputData;
};

export const validatePinCollectionData = (
  collectionId: CollectionIdType,
  collectionName: string,
  collectionData: PinpanionData|undefined
): boolean => {
  if (collectionData === undefined) {
    throw new PinCollectionDataValidationError(collectionId, 'Pin collection data not yet loaded for collection ' + collectionName);
  }

  if (!collectionData?.baseImageUrl) {
    console.warn('When validating pin collection', { ...collectionData, categories: [], events: [], groups: [], pins: [], paxs: [], sets: [], pax: [] });
    throw new PinCollectionImageBaseUrlMissing(collectionId, collectionName);
  }
  return true;
};

export const defaultDevPinLoader: CollectionTypeLoader<PinIdType, Pin, PinpanionData> = {
  collectionData: undefined,
  collectionId: '83fd0b3e-dd08-4707-8135-e5f138a43f00',
  convertDatasourceOnLoad: datasourceConvertor,
  datasourceUrl: PIN_LIST_URL,
  getNumberOfElements: countPinsInCollection,
  getObjectByIndex: getObjectByIndex,
  getObjectForId: getObjectForId,
  getObjectId: getObjectId,
  maxElementsPerComparison: 3,
  name: 'pinpanion_dev',
  validateData: validatePinCollectionData,
};

export const clientPinLoader: ClientCollectionType<PinIdType, Pin> = {
  getObjectId: getObjectId,
};

class PinCollectionDataValidationError extends CollectionDataValidationError {
  constructor(collectionId: string, errorMessage: string) {
    super(collectionId, errorMessage);
  }
}

export class PinCollectionImageBaseUrlMissing extends PinCollectionDataValidationError {
  constructor(collectionId: string, collectionName: string) {
    super(collectionId, 'No URL for pin image locations provided on collection ' + collectionName);
  }
}
