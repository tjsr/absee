import {
  CollectionIdType,
  ComparisonRequestPutBody,
  IPAddress,
  SnowflakeType,
  UserId
} from './types.ts';

import { ComparisonModel } from './types/model.ts';
import { ComparisonRequestResponseBody } from './types/datasource.ts';
import { PrismaClient } from '@prisma/client';
import { retrieveComparisonRequest } from './api/retrieveComparison.ts';
import { storeComparisonElements } from './comparisonelement.ts';

// import { basicMySqlInsert } from './database/mysql/basicMysqlInsert.ts';
// import {
//   retrieveComparisonRequest
// } from './database/mysql.ts';



const storeComparison = (
  prisma: PrismaClient,
  comparisonRequest: ComparisonRequestPutBody
): Promise<void> => {
  return prisma.comparison.create({
    data: {
      collectionId: comparisonRequest.collectionId,
      id: BigInt(comparisonRequest.id),
      requestIp: comparisonRequest.requestIp,
      requestTime: comparisonRequest.requestTime,
      userId: comparisonRequest.userId,
    },
  }).then(() => {
    return Promise.resolve();
  }).catch((err) => {
    console.error('Error while storing comparison request', err);
    return Promise.reject(err);
  });
};

export const storeComparisonRequest = <IdType extends CollectionIdType>(
  prisma: PrismaClient,
  comparisonRequest: ComparisonModel<IdType>
): Promise<unknown[]> => {
  const postRequest: ComparisonRequestPutBody = {
    collectionId: comparisonRequest.collectionId,
    id: comparisonRequest.id,
    requestIp: comparisonRequest.requestIp,
    requestTime: comparisonRequest.requestTime,
    userId: comparisonRequest.userId,
  };
  console.log('Storing comparison request', postRequest);
  return storeComparison(prisma, postRequest).then(() => Promise.all([
    ...storeComparisonElements(prisma, comparisonRequest.id, comparisonRequest.a),
    ...storeComparisonElements(prisma, comparisonRequest.id, comparisonRequest.b),
  ])).catch((err) => {
    console.error('Error while storing comparison', err);
    return Promise.reject(err);
  });
};

const ipAddressMatches = (first: IPAddress, second: IPAddress): boolean => {
  const localhost: IPAddress[] = ['::ffff:127.0.0.1', '::1'];
  if (localhost.includes(first) && localhost.includes(second)) {
    return true;
  }
  return first === second;
};

export const verifyComparisonOwner = async (
  prisma: PrismaClient,
  comparisonId: SnowflakeType,
  userId: UserId,
  requestIpAddress: IPAddress
): Promise<void> => retrieveComparisonRequest(prisma, comparisonId).then(
  (response: ComparisonRequestResponseBody) => {
    if (!ipAddressMatches(response.requestIp, requestIpAddress)) {
      throw new Error(
        `Response came from a different IP Address (${requestIpAddress}) ` +
            `origin than comparison was issued for (${response.requestIp})`
      );
    }
    if (response.userId != userId) {
      throw new Error(
        `Response came from a different user (${response.userId}) than comparison was issued for (${userId})`
      );
    }
  }
);
