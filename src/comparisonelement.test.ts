import { ComparableObjectMetadata, SnowflakeType } from "./types";
import {describe, expect, test} from '@jest/globals';

import { getSnowflake } from "./snowflake";
import { storeComparisonElemment } from "./comparisonelement";

describe('comparisonelement', () => {
  test('Should write an element to the DB', async () => {
    const comparisonId: SnowflakeType = getSnowflake();
    const meta: ComparableObjectMetadata<any> = {
      id: getSnowflake(),
      elementId: getSnowflake(),
      objectId: "1",
      data: { id: "1" }
    }
    await expect(storeComparisonElemment(comparisonId, meta)).resolves;
  });
});