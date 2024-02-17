import { CollectionIdType, CollectionObject, CollectionObjectId, ComparisonResult, UserId } from '../types.js';

import { ABSeeRequest } from '../session.js';
import { CollectionTypeLoader } from '../datainfo.js';
import { createComparisonResultResponse } from '../restresponse.js';
import express from 'express';
import { getLoader } from '../loaders.js';
import { getUserId } from '../auth/user.js';
import { retrieveComparisonResults } from '../database/mysql.js';

const retrieveComparisonsForUser = async <
  IdType extends CollectionObjectId>(
  collectionId: CollectionIdType,
  userId: UserId,
  maxComparisons?: number): Promise<ComparisonResult<IdType>[]> => {
  return retrieveComparisonResults(collectionId, userId, maxComparisons);
};

export const recent = async <
  CollectionObjectType extends CollectionObject<IdType>, D, IdType extends CollectionObjectId>(
  request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType) => {
  try {
    const userId: UserId = getUserId(request);
    const loader: CollectionTypeLoader<CollectionObjectType, D, IdType> = await getLoader(loaderId);

    let maxComparisons: number|undefined;

    if (request.query.max != undefined) {
      try {
        const parsedMax = parseInt(request.query?.max as string);
        if (parsedMax < 0) {
          return response.status(400).send({ message: 'max must be a number' });
        }
        maxComparisons = parsedMax;
      } catch (err) {
        return response.status(400).send({ message: 'max must be a number' });
      }
    }

    retrieveComparisonsForUser<IdType>(
      loader.collectionId,
      userId,
      maxComparisons
    ).then((comparisons: ComparisonResult<IdType>[]) => {
      response.contentType('application/json');
      const responseJson = createComparisonResultResponse<CollectionObjectType, IdType>(comparisons, loader);
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
