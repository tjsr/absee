import { describe, expect, test } from '@jest/globals';

import { ComparableObjectModel } from './types/model.js';
import { SnowflakeType } from './types.js';
import { getSnowflake } from './snowflake.js';
import { storeComparisonElement } from './comparisonelement.js';

describe('comparisonelement', () => {
  test('Should write an element to the DB', async () => {
    const comparisonId: SnowflakeType = getSnowflake();
    const meta: ComparableObjectModel = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1',
    };
    await expect(storeComparisonElement(comparisonId, meta)).resolves;
  });
});
