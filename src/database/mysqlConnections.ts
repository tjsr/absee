import * as dotenv from 'dotenv-flow';

import mysql from 'mysql';
import path from 'path';

import { requireEnv } from '../utils.js';

export type PoolConnection = mysql.PoolConnection;

let poolConfig: mysql.PoolConfig|undefined = undefined;

export const getPoolConfig = (): mysql.PoolConfig => {
  if (!poolConfig) {
    const parseResult: dotenv.DotenvFlowConfigResult<dotenv.DotenvFlowParseResult> = dotenv.config();
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Loaded dotenv files: ${dotenv.listFiles().map(
        (file) => file.substring(file.lastIndexOf(path.sep+1))).join(', ')}`);
    }
    if (parseResult.error && dotenv.listFiles().length > 0) {
      throw new Error('Error parsing dotenv file: ' + parseResult.error.message, parseResult.error);
    } else if (parseResult.error) {
      console.debug('Error parsing dotenv file: ' + parseResult.error.message, parseResult.error);
    }

    poolConfig = {
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
    } as const;
  } else {
    console.debug('Config already loaded');
  }

  return poolConfig;
};

let connectionPool: mysql.Pool|undefined;

export const getConnectionPool = async (): Promise<mysql.Pool> => {
  return new Promise((resolve, reject) => {
    if (undefined === connectionPool) {
      try {
        connectionPool = mysql.createPool(getPoolConfig());
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

export const safeReleaseConnection = (connection: PoolConnection): boolean => {
  if (connection !== undefined) {
    connection.release();
    return true;
  } else {
    console.trace('Attempted to release an undefined connection object');
    return false;
  }
};

export const getConnection = async (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    getConnectionPool().then((pool: mysql.Pool) => {
      try {
        pool.getConnection((err, connection) => {
          if (err) {
            safeReleaseConnection(connection);
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

export const closeConnectionPool = async (): Promise<void> => {
  if (connectionPool === undefined) {
    return Promise.reject(new Error('Attempted to close an undefined connection pool'));
  } else {
    return new Promise((resolve, reject) => {
      if (connectionPool) {
        connectionPool.end((err) => {
          if (err) {
            return reject(err);
          }
        });
      } else {
        return reject(new Error('Connection pool already closed when trying to end.'));
      }
      connectionPool = undefined;
      return resolve();
    });
  }
};
