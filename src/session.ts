import * as Express from 'express';
import * as dotenv from 'dotenv';
import * as expressSession from 'express-session';

import { EmailAddress, UserId, uuid, uuid4, uuid5 } from './types';
import session, { Session, SessionData } from 'express-session';

import { IncomingHttpHeaders } from 'http';
import { createRandomUserId } from './auth/user';
import express from 'express';
import { getConnectionPool } from './database/mysql';
import mySQLStore from 'express-mysql-session';
import { v4 as uuidv4 } from 'uuid';

export interface ABSeeSessionData extends SessionData {
  userId: UserId;
  email: EmailAddress;
}

export interface ABSeeRequest extends Express.Request {
  session: Session & Partial<ABSeeSessionData>;
}

dotenv.config();
const IN_PROD = process.env.NODE_ENV === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;

const sessionStoreOptions = {
  schema: {
    columnNames: {
      data: 'sess',
      expires: 'expire',
      session_id: 'session_id',
    },
    tableName: 'session',
  },
};
const MysqlSessionStore = mySQLStore(expressSession);

const sessionStore = new MysqlSessionStore(
  sessionStoreOptions /* session store options */,
  getConnectionPool()
);

const memoryStore = new session.MemoryStore();

export const getSession = () => {
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
      if (req.sessionID) {
        return req.sessionID;
      }
      const cookieValue = req.cookies['sessionId'];
      if (cookieValue !== undefined && cookieValue !== 'undefined') {
        return cookieValue;
      }
      const newId: uuid4 = uuidv4(); // use UUIDs for session IDs
      return newId;
    },
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || '',
    store: sessionStore !== undefined ? sessionStore : memoryStore,
  });
};

export const useSessionId = (
  req: ABSeeRequest,
  res: express.Response,
  next: () => void
) => {
  const sessionId = req.header('x-session-id');
  if (sessionId && sessionId !== 'undefined') {
    if (!req.sessionID) {
      req.sessionID = sessionId;
    }
    // retrieve session from session store using sessionId
    req.sessionStore.get(sessionId, (err, sessionData) => {
      if (!err) {
        req.session.save();
      }
      if (sessionData) {
        req.session = Object.assign(req.session, sessionData);
        if (req.session.userId == undefined) {
          const userId: uuid5 = createRandomUserId();
          console.log(
            `Assigned a new userId ${userId} to session ${sessionId}`
          );
          req.session.userId = userId;
        }
      }
      next();
    });
  } else {
    if (req.session.userId == undefined) {
      const userId: uuid5 = createRandomUserId();
      console.log(
        `Assigned a new userId ${userId} to session ${req.session.id}`
      );
      req.session.userId = userId;
    }

    next();
  }
};
