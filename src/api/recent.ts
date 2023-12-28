import { CollectionIdType, ComparisonResult, UserId } from '../types';
import { getUserId, getUserIdentificationString } from '../auth/user';

import { ABSeeRequest } from '../session';
import { CollectionTypeLoader } from '../datainfo';
import { createComparisonResultResponse } from '../restresponse';
import express from 'express';
import { getIp } from '../server';
import { getLoader } from '../loaders';
import { retrieveComparisonResults } from '../database/mysql';

const retrieveComparisonsForUser = async <T>(
  collectionId: string,
  userId: UserId,
  maxComparisons?: number): Promise<ComparisonResult[]> => {
  return retrieveComparisonResults(collectionId, userId);
};

export const recent = async <T, D>(request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType) => {
  // = async <T, D>(
  // request: express.Request,
  // response: express.Response,
  // loaderId: CollectionIdType
  try {
    const userId: UserId = getUserId(request);
    const idString: string = getUserIdentificationString(request);
    const ipAddress = getIp(request);
    const loader: CollectionTypeLoader<T, D> = await getLoader(loaderId);

    let maxComparisons: number|undefined;

    if (request.params.max != undefined) {
      try {
        const parsedMax = parseInt(request.params.max);
        if (parsedMax < 0) {
          return response.status(400).send({ message: 'max must be a number' });
        }
        maxComparisons = parsedMax;
      } catch (err) {
        return response.status(400).send({ message: 'max must be a number' });
      }
    }

    retrieveComparisonsForUser<T>(
      loader.collectionId,
      userId,
      maxComparisons
    ).then((comparisons: ComparisonResult[]) => {
      response.contentType('application/json');
      const responseJson = createComparisonResultResponse<T>(comparisons, loader);
      response.send(responseJson);
      response.end();
    }).catch((err: Error) => {
      response.status(500);
      response.send({ message: err.message });
      response.end();
    });
  } catch (err) {
    response.status(500);
    response.send({ message: 'error' });
    response.end();
  }
};
