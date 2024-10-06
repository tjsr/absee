import * as Express from 'express';
import * as expressSession from 'express-session';

import { EmailAddress, UserId } from './types.js';
import { Session, SessionData } from 'express-session';
import mySQLStore, { MySQLStore } from 'express-mysql-session';

import { RequiredEnvError } from './types/errortypes.js';
import { getPoolConfig } from './database/mysqlConnections.js';
import { loadEnv } from '@tjsr/simple-env-utils';
import mysql from 'mysql';

loadEnv({ debug: true });

export interface ABSeeSessionData extends SessionData {
  id: string;
  userId: UserId;
  email: EmailAddress;
  username: string;
  accessToken: string;
}

export interface ABSeeRequest extends Express.Request {
  session: Session & Partial<ABSeeSessionData>;
}

let poolConfig: mysql.PoolConfig;
try {
  poolConfig = getPoolConfig();
} catch (err: any) {
  if (err instanceof RequiredEnvError) {
    const reqEnv: RequiredEnvError = err;
    console.error(`Failed getting MySQL pool config: Environment variable ${reqEnv.varname} not set.`);
    process.exit(1);
  }
  console.error(`Failed getting MySQL pool config: ${err.message}`, err);
  process.exit(2);
}

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

