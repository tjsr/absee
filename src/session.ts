import * as Express from 'express';
import * as dotenv from 'dotenv';

import session, { Session, SessionData } from 'express-session';

import MySQLStore from 'express-mysql-session';
import { UserId } from './types';
import { getConnection } from './database/mysql';
import { v4 as uuidv4 } from "uuid";

export interface ABSeeSessionData extends SessionData {
  userId: UserId;
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
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'data'
		}
	}
};
// const sessionStore = new MySQLStore(sessionStoreOptions/* session store options */, getConnection());

export const getSession = () => {
  return session( {
    resave: true,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || '',
    genid: function(req) {
      return uuidv4() // use UUIDs for session IDs
    },
    cookie: {
      maxAge: TWENTYFOUR_HOURS,
      sameSite: true,
      secure: IN_PROD
    }
  })
};
