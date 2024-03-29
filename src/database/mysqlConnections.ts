import * as dotenv from 'dotenv';

import mysql from 'mysql';
import { requireEnv } from '../utils.js';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

const config: mysql.PoolConfig = {
  bigNumberStrings: true,
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

let connectionPool: mysql.Pool;
try {
  connectionPool = mysql.createPool(config);
} catch (err) {
  console.error('Failed creating connection pool.', err);
  process.exit(1);
}

export const getConnectionPool = (): mysql.Pool => {
  return connectionPool;
};

export const getConnection = async (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};
