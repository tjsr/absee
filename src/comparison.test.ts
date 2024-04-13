import { CollectionObjectId, SnowflakeType } from './types.js';
import { ComparableObjectModel, ComparisonModel } from './types/model.js';

import { closeConnectionPool } from './database/mysqlConnections.js';
import { getSnowflake } from './snowflake.js';
import { storeComparisonRequest } from './comparison.js';
import { v4 as uuidv4 } from 'uuid';

describe('comparison', () => {
  test('Should write a comparison request to the DB', async <IdType extends CollectionObjectId>(): Promise<void> => {
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

    await expect(storeComparisonRequest(comparisonRequest)).resolves.not.toThrow();
  });

  afterEach(async () => closeConnectionPool(true));
});
