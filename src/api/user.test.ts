import { AbseeUserSessionData } from '../types.js';
import { SESSION_ID_HEADER } from './apiUtils.js';
import express from 'express';
import session from 'express-session';
import { startApp } from '../server.js';
import supertest from 'supertest';

describe('API tests for tags', () => {
  let app: express.Express;
  const testSessionId = 's1234';
  const testUserId = 'u1234';

  beforeAll(async () => {
    const memoryStore = new session.MemoryStore();
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
      userId: testUserId,
    } as AbseeUserSessionData);
    app = startApp({ sessionOptions: { name: SESSION_ID_HEADER, store: memoryStore } });
    return;
  });

  it('GET /user with sessionId', async () => {
    const response = await supertest(app).get('/user/123').set(SESSION_ID_HEADER, testSessionId);
    expect(response.status).toBe(200);
    expect(response.header['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body.userId).toBe('u1234');
    return Promise.resolve();
  });
});
