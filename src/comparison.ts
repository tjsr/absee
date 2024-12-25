import {
  CollectionIdType,
  ComparisonRequestPutBody,
  DatabaseConnection,
  IPAddress,
  SnowflakeType,
  UserId
} from './types.js';

import { ComparisonModel } from './types/model.js';
import { ComparisonRequestResponseBody } from './types/datasource.js';
import { basicMySqlInsert } from './database/basicMysqlInsert.js';
import {
  retrieveComparisonRequest
} from './database/mysql.js';
import { storeComparisonElements } from './comparisonelement.js';

export const storeComparisonRequest = async <IdType extends CollectionIdType>(
  conn: DatabaseConnection,
  comparisonRequest: ComparisonModel<IdType>
): Promise<void> => {
  const postRequest: ComparisonRequestPutBody = {
    collectionId: comparisonRequest.collectionId,
    id: comparisonRequest.id,
    requestIp: comparisonRequest.requestIp,
    requestTime: comparisonRequest.requestTime,
    userId: comparisonRequest.userId,
  };
  console.log('Storing comparison request', postRequest);
  const allPromises: Promise<void>[] = [
    ...storeComparisonElements(conn, comparisonRequest.id, comparisonRequest.a),
    ...storeComparisonElements(conn, comparisonRequest.id, comparisonRequest.b),
    basicMySqlInsert(conn, 'Comparison', Object.keys(postRequest), postRequest),
  ];
  const resolved = Promise.all(allPromises)
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      console.error('Error while storing comparison', err);
      return Promise.reject(err);
    });
  return resolved;
};

const ipAddressMatches = (first: IPAddress, second: IPAddress): boolean => {
  const localhost: IPAddress[] = ['::ffff:127.0.0.1', '::1'];
  if (localhost.includes(first) && localhost.includes(second)) {
    return true;
  }
  return first === second;
};

export const verifyComparisonOwner = async (
  conn: DatabaseConnection,
  comparisonId: SnowflakeType,
  userId: UserId,
  requestIpAddress: IPAddress
): Promise<void> => {
  return new Promise((resolve, reject) => {
    retrieveComparisonRequest(conn, comparisonId).then(
      (response: ComparisonRequestResponseBody) => {
        if (!ipAddressMatches(response.requestIp, requestIpAddress)) {
          reject(
            new Error(
              `Response came from a different IP Address (${requestIpAddress}) ` +
                `origin than comparison was issued for (${response.requestIp})`
            )
          );
        }
        if (response.userId != userId) {
          reject(
            new Error(
              `Response came from a different user (${response.userId}) than comparison was issued for (${userId})`
            )
          );
        }
        resolve();
      }
    );
  });
};
