import * as Express from 'express';
import * as dotenv from 'dotenv';
import * as expressSession from 'express-session';

import { EmailAddress, UserId, uuid } from './types';
import { getConnection, getConnectionPool } from './database/mysql';
import session, { Session, SessionData } from 'express-session';

import { IncomingHttpHeaders } from 'http';
import MySQLStore from 'express-mysql-session';
import { createRandomUserId } from './utils';
import express from 'express';
import { v4 as uuidv4 } from "uuid";

export interface ABSeeSessionData extends SessionData {
  userId: UserId;
  email: EmailAddress;
}

export interface ABSeeRequest extends Express.Request {
 session: Session & Partial<ABSeeSessionData>;
}

dotenv.config();
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = (1000 * 60 * 60) * 2;
const TWENTYFOUR_HOURS = (1000 * 60 * 60) * 24;


const sessionStoreOptions = {
  schema: {
		tableName: 'session',
		columnNames: {
			session_id: 'session_id',
			expires: 'expire',
			data: 'sess'
		}
	}
};
const mysqlSessionStore = MySQLStore(expressSession);

const sessionStore = new mysqlSessionStore(sessionStoreOptions/* session store options */, getConnectionPool());

var memoryStore = new session.MemoryStore();

export const getSession = () => {
  return session( {
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || '',
    genid: function(req: express.Request) {
      const headers: IncomingHttpHeaders = req.headers;
      const sessionIdHeader: string|string[]|undefined = headers['x-session-id'];
      if (typeof sessionIdHeader === 'string' && sessionIdHeader !== 'undefined') {
        return sessionIdHeader;
      }
      if (req.sessionID) {
        return req.sessionID;
      }
      const cookieValue = req.cookies['sessionId'];
      if (cookieValue !== undefined && cookieValue !== 'undefined') {
        return cookieValue;
      }
      const newId = uuidv4();  // use UUIDs for session IDs
      return newId;
    },
    cookie: {
      maxAge: TWENTYFOUR_HOURS,
      sameSite: true,
      secure: IN_PROD,
      path: "/",
    },
    store: sessionStore !== undefined ? sessionStore : memoryStore,
  })
};

export const useSessionId = (req: ABSeeRequest, res:express.Response, next: () => void) => {
  const sessionId = req.header('x-session-id');
  if (sessionId && sessionId !== 'undefined') {
    if (!req.sessionID) {
      req.sessionID = sessionId;
    }
    // retrieve session from session store using sessionId
     req.sessionStore.get(sessionId, (err, sessionData) => {
      if (!err) {
        // console.warn(`No session found for ${sessionId}`);
        req.session.save();
      }
      if (sessionData) {
        // req.session.id = sessionId;
        // req.session.id = req.sessionID;
        req.session = Object.assign(req.session, sessionData);
        // Object.assign(req.session, { id: sessionId });
        // req.session.cookie = sessionData!.cookie;
        if (req.session.userId == undefined) {
          const userId: uuid = createRandomUserId();
          console.log(`Assigned a new userId ${userId} to session ${sessionId}`);
          req.session.userId = userId;
        }
        // req.session.userId = sessionData!.userId;

        // console.log(`Found session data ${JSON.stringify(sessionData)} for sessionId: ${sessionId}`);
        // console.log(`Session: ${JSON.stringify(req.session)}`);
      }
      next();
    }); // your code to retrieve session from session store
  } else {
    if (req.session.userId == undefined) {
      const userId: uuid = createRandomUserId();
      console.log(`Assigned a new userId ${userId} to session ${req.session.id}`);
      req.session.userId = userId;
    }
    
    next();
  }
};