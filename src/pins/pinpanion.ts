import * as dotenv from 'dotenv';

import { CollectionTypeLoader } from '../datainfo';
import events from './eventnames.json';

dotenv.config();

const PIN_LIST_URL =
  process.env.PIN_LIST_URL || 'https://pinpanion.com/pins.json';

let paxs: PAX[] | undefined = undefined;
let sets: PinSet[] | undefined = undefined;

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

export type Pin = {
  id: number;
  name: string;
  year: number;
  paxName?: string;
  imageUrl: string;
  setName?: string;
  paxId: number;
  setId?: number;
  cssClass: string;
};

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
  pins: PinpanionPin[];
  paxs: PAX[];
  success: boolean;
};

export const countPinsInCollection = (
  currentLoader: CollectionTypeLoader<Pin, PinpanionData>
): number => {
  if (currentLoader.collectionData) {
    return currentLoader.collectionData.pins.length;
  }

  return 0;
};

const convertPaxIdToPaxName = (paxId: number): string => {
  const pax: PAX | undefined = paxs?.find((p) => p.id == paxId);
  return pax ? pax.name : 'Unknown';
};

const getPinSetName = (setId: number): string | undefined => {
  const set: PinSet | undefined = sets?.find((ps) => ps.id == setId);
  if (set) {
    return set.name;
  }
};

const getObjectId = (pin: Pin): string => pin.id.toString();

const convertToDisplayPin = (pin: PinpanionPin): Pin => {
  const cssClass: string | undefined = events.find(
    (e) => e.id == pin.pax_id
  )?.cssClass;
  const output: Pin = {
    cssClass: cssClass !== undefined ? cssClass : 'unknown',
    id: parseInt(pin.id),
    imageUrl: pin.image_name.split('?')[0],
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

const getObjectForIndex = (
  sourceData: PinpanionData,
  index: number
): Pin => {
  return convertToDisplayPin(sourceData.pins[index]);
};

const getPinById = (
  sourceData: PinpanionData,
  id: string
): PinpanionPin | undefined => {
  return sourceData.pins?.find((p: PinpanionPin) => p.id.toString() === id);
};

const getObjectForId = (sourceData: PinpanionData, id: string): Pin => {
  const sourcePin: PinpanionPin | undefined = getPinById(sourceData, id);
  if (sourcePin) {
    return convertToDisplayPin(sourcePin);
  }
  throw new Error(`Couldn't find pin for id ${id}`);
};

const datasourceConvertor = <PinpanionData>(inputData: any): PinpanionData => {
  paxs = inputData.paxs;
  sets = inputData.sets;
  return inputData;
};

export const loader: CollectionTypeLoader<Pin, PinpanionData> = {
  collectionData: undefined,
  collectionId: '83fd0b3e-dd08-4707-8135-e5f138a43f00',
  convertDatasourceOnLoad: datasourceConvertor,
  datasourceUrl: PIN_LIST_URL,
  getNumberOfElements: countPinsInCollection,
  getObjectByIndex: getObjectForIndex,
  getObjectForId: getObjectForId,
  getObjectId: getObjectId,
  maxElementsPerComparison: 1,
};
