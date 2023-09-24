import { EmailAddress, SnowflakeType } from '../types';
import { PoolConnection, getConnection } from './mysqlConnections';

import { ComparisonRequestResponseBody } from '../types/datasource';
import { UserModel } from '../types/model';
import { createUserIdFromEmail } from '../auth/user';

export type { PoolConnection };

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};

export const retrieveComparisonRequest = async (
  comparisonId: SnowflakeType
): Promise<ComparisonRequestResponseBody> => {
  const conn = await getConnection();

  return new Promise((resolve, reject) => {
    try {
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
    } catch (err) {
      reject(err);
    }
  });
};
