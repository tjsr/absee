import { CollectionObjectId, SnowflakeType } from './types.js';
import { Pool, closeConnectionPool, getConnectionPool } from '@tjsr/mysql-pool-utils';

import { ComparableObjectModel } from './types/model.js';
import { TaskContext } from 'vitest';
import { getSnowflake } from './snowflake.js';
import { storeComparisonElement } from './comparisonelement.js';

type TestWithPoolConnection = TaskContext & 
  {
    poolPromise: Promise<Pool>;
  };

describe('comparisonelement', () => {
  beforeEach((ctx: TestWithPoolConnection) => { 
    ctx.poolPromise = getConnectionPool(ctx.task.name);
  });
  test('Should write an element to the DB', async (
    ctx: TestWithPoolConnection
  ):Promise<void> => {
    const comparisonId: SnowflakeType = getSnowflake();
    const meta: ComparableObjectModel<CollectionObjectId> = {
      elementId: getSnowflake(),
      id: getSnowflake(),
      objectId: '1' as CollectionObjectId,
    };
    const conn = ctx.poolPromise.then((pool) => pool.getConnection());
    await expect(storeComparisonElement(conn, comparisonId, meta)).resolves.not.toThrow();
  });

  afterEach((ctx: TaskContext) => closeConnectionPool(ctx.task.name));
});
