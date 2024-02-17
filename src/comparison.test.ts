import { CollectionObjectId, SnowflakeType } from './types.js';
import { ComparableObjectModel, ComparisonModel } from './types/model.js';
import { describe, expect, test } from '@jest/globals';

import { getSnowflake } from './snowflake.js';
import { storeComparisonRequest } from './comparison.js';
import { v4 as uuidv4 } from 'uuid';

describe('comparison', () => {
  test('Should write a comparison request to the DB', <IdType extends CollectionObjectId>(): void => {
    const comparisonId: SnowflakeType = getSnowflake();
    const metaa: ComparableObjectModel<IdType> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1' as IdType,
    };

    const metab: ComparableObjectModel<IdType> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '2' as IdType,
    };
    const comparisonRequest: ComparisonModel<IdType> = {
      a: [metaa],
      b: [metab],
      collectionId: uuidv4(),
      id: comparisonId,
      requestIp: '127.0.0.1',
      requestTime: new Date(),
      userId: uuidv4(),
    };

    expect(storeComparisonRequest(comparisonRequest)).resolves;
  });
});
