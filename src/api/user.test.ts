import { generateUserIdForTestName, setSessionCookie } from '@tjsr/testutils';

import { SESSION_ID_HEADER } from './apiUtils.js';
import { UserSessionOptions } from '@tjsr/user-session-middleware';
import express from 'express';
import { getConnectionPool } from '@tjsr/mysql-pool-utils';
import { getGoogleAuthSettings } from '../auth/settings.js';
import session from 'express-session';
import { startApp } from '../server.js';
import supertest from 'supertest';

describe('API tests for tags', () => {
  let app: express.Express;
  const testSessionId = 's1234';
  const testUserId = 'u1234';

  beforeEach(async (ctx) => {
    const memoryStore = new session.MemoryStore();
    const connectionPool = await getConnectionPool('test');
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
      email: 'test@test.com',
      hasLoggedOut: false,
      newId: false,
      userId: testUserId,
    });
    const sessionOptions: Partial<UserSessionOptions> = {
      name: SESSION_ID_HEADER,
      secret: ctx.task.name,
      store: memoryStore,
      userIdNamespace: generateUserIdForTestName(ctx.task.name),
    };

    app = startApp({
      connectionPool,
      googleAuthSettings: getGoogleAuthSettings(),
      sessionOptions,
    });

    const eh: express.ErrorRequestHandler = (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).send('Error: ' + err.message);
    };
    app.use(eh);
  });

  it('GET /user with sessionId', async (context) => {
    let st = supertest(app).get('/user/123');
    st = setSessionCookie(st, SESSION_ID_HEADER, testSessionId, context.task.name);
    const response = await st;

    expect(response.status).toBe(200);
    expect(response.header['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body.userId).toBe('u1234');
    return Promise.resolve();
  });
});
