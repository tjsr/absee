import * as Express from 'express';
import * as expressSession from 'express-session';

import { EmailAddress, UserId } from './types.js';
import { Session, SessionData } from 'express-session';
import { getConnectionPool, getPoolConfig } from './database/mysqlConnections.js';
import mySQLStore, { MySQLStore } from 'express-mysql-session';

import mysql from 'mysql';

export interface ABSeeSessionData extends SessionData {
  id: string;
  userId: UserId;
  email: EmailAddress;
  username: string;
  accessToken: string;
}

export interface ABSeeRequest extends Express.Request {
  session: Session & Partial<ABSeeSessionData>;
  // user?: Profile;
}

const poolConfig: mysql.PoolConfig = getPoolConfig();

const sessionStoreOptions: mySQLStore.Options = {
  createDatabaseTable: true,
  database: poolConfig.database,
  host: poolConfig.host,
  password: poolConfig.password,
  port: poolConfig.port,
  schema: {
    columnNames: {
      data: 'sess',
      expires: 'expire',
      session_id: 'session_id',
    },
    tableName: 'session',
  },
  user: poolConfig.user,
};

export let mysqlSessionStore: MySQLStore;
try {
  const MysqlSessionStore = mySQLStore(expressSession);
  mysqlSessionStore = new MysqlSessionStore(
    sessionStoreOptions /* session store options */
  );
} catch (err) {
  console.error(`Failed getting MySQL session store`, err);
  process.exit(2);
}

