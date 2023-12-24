import { ComparisonResult, UserId } from '../types';
import express, { NextFunction } from 'express';
import { getUserId, getUserIdentificationString } from '../auth/user';

import { ABSeeRequest } from '../session';
import { Pin } from '../pins/pinpanion';
import { getIp } from '../server';
import { retrieveComparisonResults } from '../database/mysql';

const retrieveComparisonsForUser = async <T>(userId: UserId): Promise<ComparisonResult<T>[]> => {
  return retrieveComparisonResults();
};

export const recent = (request: ABSeeRequest, response: express.Response, next: NextFunction) => {
  // = async <T, D>(
  // request: express.Request,
  // response: express.Response,
  // loaderId: CollectionIdType
  try {
    const collection: string = request.params.collection;
    const userId: UserId = getUserId(request);
    const idString: string = getUserIdentificationString(request);
    const ipAddress = getIp(request);

    retrieveComparisonsForUser<Pin>(userId).then((comparisons: ComparisonResult<Pin>[]) => {
      response.contentType('application/json');
      response.send(comparisons);
      // response.end();
      next();
    }).catch((err: Error) => {
      response.status(500);
      response.send({ message: err.message });
      response.end();
      // next();
    });
  } catch (err) {
    response.status(500);
    response.send({ message: 'error' });
    response.end();
  }
};
