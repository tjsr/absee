import * as dotenv from 'dotenv';
import * as expressSession from 'express-session';

import express, { Response } from 'express';

import { IncomingHttpHeaders } from 'http';
import session from 'express-session';
import { uuid4 } from '../types';
import { v4 as uuidv4 } from 'uuid';

const memoryStore = new session.MemoryStore();

dotenv.config();
const IN_PROD = process.env.NODE_ENV === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;

export const setUserCookies = (sessionId: string, userId: string,
  displayName: string, response: Response): void => {
  // console.log(`Setting user_id=${userId},displayName=${displayName} in callback for session=${sessionId}`);
  const cookies: Map<string, string> = new Map<string, string>();
  response.header('access-control-expose-headers', 'Set-Cookie');
  cookies.set('user_id', userId);
  cookies.set('displayName', displayName);

  cookies.set('sessionId', sessionId);
  // const cookieArr: string[] = [];
  cookies.forEach((value, key) => {
    // const cookieString = cookieArr.join('; ') + '; Path=/; SameSite=Lax';
    // const cookieString = `${key}=${value}; Path=/; SameSite=Lax`;
    response.cookie(key, value);
    // cookieArr.push(`${key}=${value}`);
  });
};

export const getSession = (useSessionStore: expressSession.Store = memoryStore) => {
  return session({
    cookie: {
      maxAge: IN_PROD ? TWO_HOURS : TWENTYFOUR_HOURS,
      path: '/',
      sameSite: true,
      secure: IN_PROD,
    },
    genid: function (req: express.Request) {
      const headers: IncomingHttpHeaders = req.headers;
      const sessionIdHeader: string | string[] | undefined =
        headers['x-session-id'];
      if (
        typeof sessionIdHeader === 'string' &&
        sessionIdHeader !== 'undefined'
      ) {
        return sessionIdHeader;
      }
      if (req.session?.id) {
        return req.session.id;
      }
      const cookieValue = req.cookies?.sessionId;
      if (cookieValue !== undefined && cookieValue !== 'undefined') {
        return cookieValue;
      }
      const newId: uuid4 = uuidv4(); // use UUIDs for session IDs
      return newId;
    },
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || uuidv4(),
    store: useSessionStore !== undefined ? useSessionStore : memoryStore,
  });
};
