import { CollectionObjectId, SnowflakeType } from './types.js';
import { describe, expect, test } from '@jest/globals';

import { ComparableObjectModel } from './types/model.js';
import { getSnowflake } from './snowflake.js';
import { storeComparisonElement } from './comparisonelement.js';

describe('comparisonelement', () => {
  test('Should write an element to the DB', async <IdType extends CollectionObjectId>():Promise<void> => {
    const comparisonId: SnowflakeType = getSnowflake();
    const meta: ComparableObjectModel<IdType> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1' as IdType,
    };
    await expect(storeComparisonElement(comparisonId, meta)).resolves;
  });
});
