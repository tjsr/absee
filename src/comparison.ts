import { ComparisonRequestPutBody, IPAddress, SnowflakeType, UserId } from "./types";
import { PoolConnection, basicMySqlInsert, getConnection } from "./database/mysql";

import { ComparisonModel } from "./types/model";
import { ComparisonRequestResponseBody } from "./types/datasource";
import { storeComparisonElements } from "./comparisonelement";

export const storeComparisonRequest = async <T>(comparisonRequest: ComparisonModel<T>): Promise<void> => {
  const postRequest: ComparisonRequestPutBody = {
    id: comparisonRequest.id,
    userId: comparisonRequest.userId,
    requestTime: comparisonRequest.requestTime,
    requestIp: comparisonRequest.requestIp,
  };
  const allPromises: Promise<void>[] = [
    ...storeComparisonElements(comparisonRequest.id, comparisonRequest.a),
    ...storeComparisonElements(comparisonRequest.id, comparisonRequest.b),
    basicMySqlInsert<ComparisonRequestPutBody>('Comparison', Object.keys(postRequest), postRequest),
  ];
  const resolved = Promise.all(allPromises).then((resolved) => {
    return Promise.resolve();
  }).catch((err) => {
    console.error('Error while storing comparison', err);
    return Promise.reject(err);
  });
  return resolved;
};

const retrieveComparisonRequest = async (comparisonId: SnowflakeType): Promise<ComparisonRequestResponseBody> => {
  return new Promise((resolve, reject) => {
    try {
      getConnection().then((conn: PoolConnection) => {
        conn.query('select id, userId, requestTime, requestIp from Comparison where id=?', [comparisonId], (err, results, fields) => {
          if (err) {
            conn.release();
            return reject(err);
          }
          if (results == undefined) {
            conn.release();
            return reject(new Error(`Retrieving by comparisonId ${comparisonId} results was undefined.`));
          }
          if (results.length != 1) {
            conn.release();
            return reject(new Error(`Retrieving by comparisonId ${comparisonId} should only ever return a single row, got ${results.length}`));
          }
          const data:ComparisonRequestResponseBody = {
            id: results[0].id,
            userId: results[0].userId,
            requestTime: results[0].requestTime,
            requestIp: results[0].requestIp
          }
          resolve(data);
          conn.release();
        });
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
};

const ipAddressMatches = (first: IPAddress, second: IPAddress): boolean => {
  const localhost:IPAddress[] = ['::ffff:127.0.0.1', '::1'];
  if (localhost.includes(first) && localhost.includes(second)) {
    return true;
  }
  return first === second;
}

export const verifyComparisonOwner = async (comparisonId: SnowflakeType, userId: UserId, requestIpAddress: IPAddress): Promise<void> => {
  return new Promise((resolve, reject) => {
      retrieveComparisonRequest(comparisonId).then((response: ComparisonRequestResponseBody) => {
      if (!ipAddressMatches(response.requestIp, requestIpAddress)) {        
        reject(new Error(`Response came from a different IP Address (${requestIpAddress}) origin than comparison was issued for (${response.requestIp})`));
      }
      if (response.userId != userId) {
        reject(new Error('Response came from a different user than comparison was issued for'));
      }
      resolve();
    });
  });
};
