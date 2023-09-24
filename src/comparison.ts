import {
  ComparisonRequestPutBody,
  IPAddress,
  SnowflakeType,
  UserId
} from './types';

import { ComparisonModel } from './types/model';
import { ComparisonRequestResponseBody } from './types/datasource';
import { basicMySqlInsert } from './database/basicMysqlInsert';
import {
  retrieveComparisonRequest
} from './database/mysql';
import { storeComparisonElements } from './comparisonelement';

export const storeComparisonRequest = async <T>(
  comparisonRequest: ComparisonModel
): Promise<void> => {
  const postRequest: ComparisonRequestPutBody = {
    collectionId: comparisonRequest.collectionId,
    id: comparisonRequest.id,
    requestIp: comparisonRequest.requestIp,
    requestTime: comparisonRequest.requestTime,
    userId: comparisonRequest.userId,
  };
  const allPromises: Promise<void>[] = [
    ...storeComparisonElements(comparisonRequest.id, comparisonRequest.a),
    ...storeComparisonElements(comparisonRequest.id, comparisonRequest.b),
    basicMySqlInsert('Comparison', Object.keys(postRequest), postRequest),
  ];
  const resolved = Promise.all(allPromises)
    .then((resolved) => {
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
  comparisonId: SnowflakeType,
  userId: UserId,
  requestIpAddress: IPAddress
): Promise<void> => {
  return new Promise((resolve, reject) => {
    retrieveComparisonRequest(comparisonId).then(
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
              'Response came from a different user than comparison was issued for'
            )
          );
        }
        resolve();
      }
    );
  });
};
