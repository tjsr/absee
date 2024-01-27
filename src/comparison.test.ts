import { ComparableObjectModel, ComparisonModel } from './types/model.js';
import { describe, expect, test } from '@jest/globals';

import { SnowflakeType } from './types.js';
import { getSnowflake } from './snowflake.js';
import { storeComparisonRequest } from './comparison.js';
import { v4 as uuidv4 } from 'uuid';

describe('comparison', () => {
  test('Should write a comparison request to the DB', () => {
    const comparisonId: SnowflakeType = getSnowflake();
    const metaa: ComparableObjectModel = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1',
    };

    const metab: ComparableObjectModel = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '2',
    };
    const comparisonRequest: ComparisonModel = {
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
