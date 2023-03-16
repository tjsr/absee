import * as dotenv from 'dotenv';

import { CollectionTypeLoader } from '../datainfo';

dotenv.config();

const PIN_LIST_URL = process.env.PIN_LIST_URL || "https://pinpanion.com/pins.json";

let paxs:PAX[]|undefined = undefined;

export type Pin = {
  id: number;
  name: string;
  set_id: number | null;
  sub_set_id: number | null;
  year: number;
  pax_id: number;
  alternate: string;
  image_name: string;
};

export type PAX = {
  id: number;
  name: string;
};

export const convertCollectionJson = <Pin>(data: any): Pin[] => {
  if (data.data.success === true) {
    const pins:Pin[] = data.data.pins;
    paxs = data.data.paxs;
    console.log(`Got ${pins.length} pins.`);
    return pins;
  } else {
    throw new Error('returned pin list did not have success=true');
  }
};

const getObjectForId = <Pin>(existingData: Pin[], id: string): Pin => {
  return existingData[parseInt(id)];
  // return existingData.find((p: Pin) => {
  //   return p.id === parseInt(id) }
  // )!;
};

export const loader: CollectionTypeLoader<Pin> = {
  datasourceUrl: PIN_LIST_URL,
  existingData: undefined,
  resultDataConvertor: convertCollectionJson,
  getObjectForId: getObjectForId,
};
