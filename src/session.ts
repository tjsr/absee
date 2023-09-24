import * as Express from 'express';
import * as expressSession from 'express-session';

import { EmailAddress, UserId } from './types';
import { Session, SessionData } from 'express-session';
import mySQLStore, { MySQLStore } from 'express-mysql-session';

import { getConnectionPool } from './database/mysqlConnections';

export interface ABSeeSessionData extends SessionData {
  userId: UserId;
  email: EmailAddress;
}

export interface ABSeeRequest extends Express.Request {
  session: Session & Partial<ABSeeSessionData>;
}

const sessionStoreOptions: mySQLStore.Options = {
  createDatabaseTable: true,
  schema: {
    columnNames: {
      data: 'sess',
      expires: 'expire',
      session_id: 'session_id',
    },
    tableName: 'session',
  },
};

export let mysqlSessionStore: MySQLStore;
try {
  const MysqlSessionStore = mySQLStore(expressSession);
  mysqlSessionStore = new MysqlSessionStore(
    sessionStoreOptions /* session store options */,
    getConnectionPool(),
    (err) => {
      console.warn('Error:' + err);
    }
  );
} catch (err) {
  console.error(`Failed getting MySQL session store`, err);
  process.exit(2);
}

