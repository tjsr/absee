import * as dotenv from 'dotenv';

import { EmailAddress, SnowflakeType } from '../types';

import { ComparisonRequestResponseBody } from '../types/datasource';
import { UserModel } from '../types/model';
import { createUserIdFromEmail } from '../auth/user';
import mysql from 'mysql';
import { requireEnv } from '../utils';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

const config: mysql.PoolConfig = {
  connectionLimit:
    process.env.MYSQL_CONNECTION_POOL_SIZE !== undefined ?
      parseInt(process.env.MYSQL_CONNECTION_POOL_SIZE) :
      5,
  database: requireEnv('MYSQL_DATABASE'),
  host: requireEnv('MYSQL_HOST'),
  password: requireEnv('MYSQL_PASSWORD'),
  user: requireEnv('MYSQL_USER'),
};

const connectionPool = mysql.createPool(config);

export const getConnectionPool = () => {
  return connectionPool;
};

export const getConnection = async (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

export const basicMySqlInsert = (
  table: string,
  fields: string[],
  values: any
): Promise<void> => {
  const params: string[] = Array(fields.length).fill('?');
  return new Promise((resolve, reject) => {
    getConnection()
      .then((conn: PoolConnection) => {
        conn.query(
          `insert into ${table} (${fields.join(', ')}) values (${params.join(
            ', '
          )})`,
          Object.keys(values).map((v) => values[v]),
          (err) => {
            conn.release();
            if (err && err.sqlState === '23000') {
              resolve();
            } else if (err) {
              reject(err);
            }
            resolve();
          }
        );
      })
      .catch((err) => reject(err));
  });
};

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};

export const retrieveComparisonRequest = async (
  comparisonId: SnowflakeType
): Promise<ComparisonRequestResponseBody> => {
  return new Promise((resolve, reject) => {
    try {
      getConnection()
        .then((conn: PoolConnection) => {
          conn.query(
            'select id, collectionId, userId, requestTime, requestIp from Comparison where id=?',
            [comparisonId],
            (err, results, fields) => {
              if (err) {
                conn.release();
                return reject(err);
              }
              if (results == undefined) {
                conn.release();
                return reject(
                  new Error(
                    `Retrieving by comparisonId ${comparisonId} results was undefined.`
                  )
                );
              }
              if (results.length != 1) {
                conn.release();
                return reject(
                  new Error(
                    `Retrieving by comparisonId ${comparisonId} should only ever ` +
                      `return a single row, got ${results.length}`
                  )
                );
              }
              const data: ComparisonRequestResponseBody = {
                collectionId: results[0].collectionId,
                id: results[0].id,
                requestIp: results[0].requestIp,
                requestTime: results[0].requestTime,
                userId: results[0].userId,
              };
              resolve(data);
              conn.release();
            }
          );
        })
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
};
