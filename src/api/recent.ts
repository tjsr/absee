import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonResult,
  DatabaseConnection,
  UserId
} from '../types.js';

import { ABSeeRequest } from '../session.js';
import { CollectionTypeLoader } from '../datainfo.js';
import { createComparisonResultResponse } from '../restresponse.js';
import express from 'express';
import { getLoaderFromPrisma } from '../loaders.js';
import { retrieveComparisonResults } from '../database/mysql.js';

const retrieveComparisonsForUser = async <
  IdType extends CollectionObjectId>(
  conn: DatabaseConnection,
  collectionId: CollectionIdType,
  userId: UserId,
  maxComparisons?: number): Promise<ComparisonResult<IdType>[]> => {
  return retrieveComparisonResults(conn, collectionId, userId, maxComparisons);
};

export const recent = async <
  CollectionObjectType extends CollectionObject<IdType>, D, IdType extends CollectionObjectId>(
  request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType) => {
  try {
    const userId: UserId = request.session.userId;
    const loader: CollectionTypeLoader<CollectionObjectType, D, IdType> = await getLoaderFromPrisma(
      request.app.locals.prismaClient, loaderId
    );
    const connectionPromise: DatabaseConnection = request.app.locals.connectionPromise;

    let maxComparisons: number|undefined;

    if (request.query.max != undefined) {
      try {
        const parsedMax = parseInt(request.query?.max as string);
        if (parsedMax < 0) {
          return response.status(400).send({ message: 'max must be a number' });
        }
        maxComparisons = parsedMax;
      } catch (_err) {
        return response.status(400).send({ message: 'max must be a number' });
      }
    }

    return await retrieveComparisonsForUser<IdType>(
      connectionPromise,
      loader.collectionId,
      userId,
      maxComparisons
    ).then((comparisons: ComparisonResult<IdType>[]) => {
      response.contentType('application/json');
      const responseJson = createComparisonResultResponse<CollectionObjectType, IdType>(comparisons, loader);
      response.send(responseJson);
      return response.end();
    }).catch((err: Error) => {
      return response.status(500).send({ message: err.message }).end();
    });
  } catch (_err) {
    return response.status(500).send({ message: 'error' }).end();
  }
};
