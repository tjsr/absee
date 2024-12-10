import { CollectionObjectId, SnowflakeType } from './types.js';
import { closeConnectionPool, getConnectionPool } from '@tjsr/mysql-pool-utils';

import { ComparableObjectModel } from './types/model.js';
import { TaskContext } from 'vitest';
import { getSnowflake } from './snowflake.js';
import { storeComparisonElement } from './comparisonelement.js';

describe('comparisonelement', () => {
  beforeEach((ctx: TaskContext) => getConnectionPool(ctx.task.name));
  test('Should write an element to the DB', async <IdType extends CollectionObjectId>():Promise<void> => {
    const comparisonId: SnowflakeType = getSnowflake();
    const meta: ComparableObjectModel<IdType> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1' as IdType,
    };
    await expect(storeComparisonElement(comparisonId, meta)).resolves.not.toThrow();
  });

  afterEach((ctx: TaskContext) => closeConnectionPool(ctx.task.name));
});
