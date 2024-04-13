import * as dotenv from 'dotenv';

import mysql from 'mysql';
import { requireEnv } from '../utils.js';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

const config: mysql.PoolConfig = {
  bigNumberStrings: true,
  connectTimeout: process.env['MYSQL_CONNECT_TIMEOUT'] ? parseInt(process.env['MYSQL_CONNECT_TIMEOUT']) : 2000,
  connectionLimit:
    process.env.MYSQL_CONNECTION_POOL_SIZE !== undefined ?
      parseInt(process.env.MYSQL_CONNECTION_POOL_SIZE) :
      5,
  database: requireEnv('MYSQL_DATABASE'),
  debug: process.env['MYSQL_DEBUG'] === 'true' ? true : false,
  host: requireEnv('MYSQL_HOST'),
  password: requireEnv('MYSQL_PASSWORD'),
  port: process.env['MYSQL_PORT'] ? parseInt(process.env['MYSQL_PORT']) : 3306,
  supportBigNumbers: true,
  user: requireEnv('MYSQL_USER'),
};

export const getPoolConfig = (): mysql.PoolConfig => config;

let connectionPool: mysql.Pool|undefined;

export const getConnectionPool = async (): Promise<mysql.Pool> => {
  return new Promise((resolve, reject) => {
    if (undefined === connectionPool) {
      try {
        connectionPool = mysql.createPool(config);
        resolve(connectionPool);
      } catch (err) {
        console.error('Failed creating connection pool.', err);
        reject(err);
      }
    } else {
      resolve(connectionPool);
    }
  });
};

export const getConnection = async (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    getConnectionPool().then((pool: mysql.Pool) => {
      try {
        pool.getConnection((err, connection) => {
          if (err) {
            if (connection !== undefined) {
              connection.release();
            }
            reject(err);
          } else {
            resolve(connection);
          }
        });
      } catch (mysqlError) {
        console.error('Error getting connection from pool with thrown exception.', mysqlError);
        reject(mysqlError);
      }
    }).catch((poolError) => {
      console.error('Failed getting connection pool.', poolError);
      reject(poolError);
    });
  });
};

export const safeReleaseConnection = (connection: PoolConnection): void => {
  if (connection !== undefined) {
    connection.release();
  } else {
    console.trace('Attempted to release an undefined connection object');
  }
};

const getCallerInfo = (stackOffset = 0): string | null => {
  const err = new Error();
  const stack = err.stack?.split('\n');

  if (stack && stack.length > 3+stackOffset) {
    const line = stack[3+stackOffset];
    const match = line.match(/at (.*?) \((.*?):(\d+):\d+\)$/);

    if (match) {
      const methodName = match[1];
      const fileName = match[2];
      const lineNumber = match[3];

      return `File: ${fileName}, Method: ${methodName}, Line: ${lineNumber}`;
    }
  }

  return null;
}

export const closeConnectionPool = async (afterTests?: boolean): Promise<void> => {
  if (connectionPool === undefined) {
    if (!afterTests) {
      console.warn('Attempted to close an undefined connection pool');
    }
    return Promise.reject(new Error('Attempted to close an undefined connection pool'));
  } else {
    connectionPool.end((err) => {
      if (err) {
        if (err?.stack) {
          if (!afterTests) {
            console.error(`Error closing connection pool explicitly: ${err.stack[2]}`);
          }
        } else {
          if (!afterTests) {
            console.error('Failed closing connection pool.', err);
          }
          process.exit(1);
        }
      } else if (!afterTests) {
        const currentStack = getCallerInfo(1);
        console.log(`Connection pool closed explicitly by ${currentStack}`);
      }
    });
    connectionPool = undefined;
    return Promise.resolve();
  }
};
