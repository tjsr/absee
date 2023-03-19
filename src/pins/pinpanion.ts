import * as dotenv from 'dotenv';

import { CollectionTypeLoader } from '../datainfo';

dotenv.config();

const PIN_LIST_URL = process.env.PIN_LIST_URL || "https://pinpanion.com/pins.json";

let paxs:PAX[]|undefined = undefined;
let pins:Pin[]|undefined = undefined;

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
  paxName: string;
  imageUrl: string;
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

export const countPinsInCollection = (currentLoader: CollectionTypeLoader<Pin, PinpanionData>): number => {
  if (currentLoader.collectionData) {
    return currentLoader.collectionData.pins.length;
  }

  return 0;
};

const convertPaxIdToPaxName = (paxId: number): string => {
  const pax:PAX|undefined = paxs?.find((p) => p.id == paxId);
  return pax ? pax.name : 'Unknown';
}

const convertToDisplayPin = (pin: PinpanionPin): Pin => {
  const output: Pin = {
    id: parseInt(pin.id),
    name: pin.name,
    year: pin.year,
    paxName: convertPaxIdToPaxName(pin.pax_id),
    imageUrl: pin.image_name
  };
  return output;
};

const getPinById = (sourceData: PinpanionData, id: string): PinpanionPin|undefined => {
  return sourceData.pins?.find((p: PinpanionPin) => p.id === id);
};

const getObjectForId = (sourceData: PinpanionData, id: string): Pin => {
  const sourcePin: PinpanionPin|undefined = getPinById(sourceData, id);
  if (sourcePin) {
    return convertToDisplayPin(sourcePin);
  }
  throw new Error(`Couldn't find pin for id ${id}`);
};

const datasourceConvertor = <PinpanionData>(inputData: any): PinpanionData => {
  paxs = inputData.paxs;
  return inputData;
}

export const loader: CollectionTypeLoader<Pin, PinpanionData> = {
  datasourceUrl: PIN_LIST_URL,
  collectionData: undefined,
  getNumberOfElements: countPinsInCollection,
  getObjectForId: getObjectForId,
  convertDatasourceOnLoad: datasourceConvertor
};
