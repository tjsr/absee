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

export const closeConnectionPool = async (): Promise<void> => {
  if (connectionPool === undefined) {
    return Promise.reject(new Error('Attempted to close an undefined connection pool'));
  } else {
    return new Promise((resolve, reject) => {
      if (connectionPool) {
        connectionPool.end((err) => {
          if (err) {
            reject(err);
          }
        });
        reject(new Error('Connection pool already closed when trying to end.'));
      }
      connectionPool = undefined;
      resolve();
    });
  }
};
