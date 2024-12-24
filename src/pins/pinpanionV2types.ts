import { CollectionObject, CollectionObjectId } from "../types.js";
import { PAX, PinpanionData } from "./pinpanionTypes.js";

export type PinIdType = CollectionObjectId;

export type PinpanionPin = {
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

export type PinpanionDevData = {
  categories: any[];
  sets: any[];
  events: any[];
  pins: PinpanionPin[];
  pax: PinpanionV2PAX[];
} & PinpanionData;

type UppercasePaxCode = 'PAX_WEST'
  | 'PAX_EAST' | 'PAX_AUS'
  | 'PAX_ONLINE' | 'PAX_SOUTH'
  | 'PAX_UNPLUGGED' | undefined; // PAX_*

type PAXCSSStyleName = 'west' | 'east' | 'aus' | 'online' | 'south' | 'unplugged' | 'gaming' | 'prime' | 'limited';

export type PinpanionV2PAX = {
  shortName?: UppercasePaxCode;
  styleName: PAXCSSStyleName;
} & PAX;
