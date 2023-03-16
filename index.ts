import * as dotenv from 'dotenv';

import { initializeLoader, retrieveCollectionData } from './src/datainfo';

import { loader as pinLoader } from './src/pins/pinpanion';
import { startApp } from './src/server';

dotenv.config();

const ID_UUID_NAMESPACE = process.env.ID_UUID_NAMESPACE || 'f345a1f6-ee55-4621-a46d-77e663c7a775';
const COMPARISON_UUID_NAMESPACE = process.env.COMPARISON_UUID_NAMESPACE || 'd1012c53-7978-4fd8-a10a-faf15d050242';

const getValues = (elements: number): any[] => {
  let arr: any[] = [];
  for (let i = 1;i <= elements;i++) {
    arr.push({ id: i });
  }
  return arr;
};

export const getRandomId = (): number => {
  return Math.floor(Math.random() * COMPARABLE_OBJECTS.length);
};

const COMPARABLE_OBJECTS:any[] = getValues(64);

// export const getElementData = <T>(objectId: string): T => {
//   return {
//     id: objectId,
//   } as T;
// };

initializeLoader(pinLoader).then(() => {
  startApp(pinLoader);
}).catch((err:Error) => {
  console.error('Failed getting pin collection data: ' + err.message);
});