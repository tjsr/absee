import { CollectionTypeLoader, initializeLoader } from "../datainfo.js";
import { Pin, PinIdType, PinpanionDevData } from "./pinpanionV2types.js";
import { defaultDevPinLoader, validateV2PinCollectionData } from "./pinpanionV2.js";

import { TaskContext } from "vitest";
import fs from 'node:fs';
import path from "node:path";

const TEST_DATA_FILE = 'pinpanion.dev.20241223.json';
type PinpanionV2LoaderContext = TaskContext &
  { localFileData: any, loader: CollectionTypeLoader<PinIdType, Pin, PinpanionDevData> };

describe('pinpanionV2', () => {
  let localFileData: any = undefined;
  beforeAll(() => {
    let dataPath = undefined;
    dataPath = path.join(process.cwd(), 'data/pinpanion', TEST_DATA_FILE);
    if (!fs.existsSync(dataPath)) {
      dataPath = path.resolve(path.join('../..', 'data/pinpanion', TEST_DATA_FILE));
    }
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Can't find data file ${TEST_DATA_FILE}`);
    }

    const data = fs.readFileSync(dataPath, 'utf8');
    localFileData = JSON.parse(data);
  });

  beforeEach((context: PinpanionV2LoaderContext) => {
    context.loader = { 
      ...defaultDevPinLoader,
    };
  });

  test('Should use existing cache data from disk', async (context: PinpanionV2LoaderContext) => {
    context.loader.collectionData = localFileData;
    expect(context.loader.collectionData).toBeDefined();
    context.loader.collectionData!.baseImageUrl = 'https://dev.pinpanion.com/imgs';
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

  test('Data from dev site should be valid.', async (context: PinpanionV2LoaderContext) => {
    const loader = context.loader;
    await initializeLoader(loader);
    loader.validateData(loader.collectionId, loader.name, loader.collectionData);
  });
});
