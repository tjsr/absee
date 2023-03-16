import { ComparisonRequestPutBody, IPAddress, SnowflakeType, UserId } from "./types";
import { sqlinsert, sqlrequest } from "./sqlrest";

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
    sqlinsert('comparison', postRequest),
  ];
  const resolved = Promise.all(allPromises).then((resolved) => {
    return Promise.resolve();
  }).catch((err) => {
    console.error(err);
    return Promise.reject(err);
  });
  return resolved;
};

const retrieveComparisonRequest = async (comparisonId: SnowflakeType): Promise<ComparisonRequestResponseBody> => {
  return new Promise((resolve, reject) => {
    sqlrequest('comparison', { id: comparisonId })
      .then((request:any) => {
        if (request.data.length == 0) {
          reject(new Error(`No comparison found for id ${comparisonId}`));
        }
        resolve(request.data[0]);
      })
      .catch(reject);
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
      console.log(response);
      resolve();
    });
  });
};