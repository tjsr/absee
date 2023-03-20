import { describe, expect, test } from '@jest/globals';

import { ComparableObjectModel } from './types/model';
import { SnowflakeType } from './types';
import { getSnowflake } from './snowflake';
import { storeComparisonElement } from './comparisonelement';

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
