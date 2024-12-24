import { CollectionTypeLoader, initializeLoader } from "../datainfo.js";
import { Pin, PinIdType, PinpanionDevData } from "./pinpanionV2types.js";
import { defaultDevPinLoader, validateV2PinCollectionData } from "./pinpanionV2.js";

import { TaskContext } from "vitest";
import fs from 'node:fs';

type PinpanionV2LoaderContext = TaskContext & { localFileData: any, loader: CollectionTypeLoader<PinIdType, Pin, PinpanionDevData> }
describe('pinpanionV2', () => {
  let localFileData: any = undefined;
  beforeAll(() => {
    const data = fs.readFileSync('file://../../../data/pinpanion.dev.20241223.json', 'utf8');
    localFileData = JSON.parse(data);
  });

  beforeEach((context: PinpanionV2LoaderContext) => {
    context.loader = { 
      ...defaultDevPinLoader,
    };
  });

  test('Should use existing cache data from disk', async (context: PinpanionV2LoaderContext) => {
    context.loader.collectionData = localFileData;
    const data = await initializeLoader(context.loader);
    expect(data).toBeDefined();
    // await context.loader.
  });

  test('Should validate data from disk', (context: PinpanionV2LoaderContext) => {
    validateV2PinCollectionData(context.loader.collectionId, context.loader.name, localFileData);
  });

  test('Should load from URL', async (context: PinpanionV2LoaderContext) => {
    context.loader.datasourceUrl = 'https://dev.pinpanion.com/pins.json';
    const data = await initializeLoader(context.loader);
    expect(data).toBeDefined();
    // await context.loader.
  });

  test('Data from dev site should be valid.', (context: PinpanionV2LoaderContext) => {
    context.loader.validateData(context.loader.collectionId, context.loader.name, context.loader.collectionData);
  });
});

describe('pinpanionV2.initializeLoader', () => {
  beforeEach((context: PinpanionV2LoaderContext) => {
    context.loader = { 
      ...defaultDevPinLoader,
      datasourceUrl: 'https://dev.pinpanion.com/pins.json',
    };
  });

  test('Should load from URL', async (context: PinpanionV2LoaderContext) => {
    const data = await initializeLoader(context.loader);
    expect(data).toBeDefined();
    // expect(data.baseImageUrl).toBeDefined();
  });
});