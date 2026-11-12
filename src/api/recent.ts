import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonResult,
  UserId
} from '../types.ts';

import { ABSeeRequest } from '../session.ts';
import { CollectionTypeLoader } from '../datainfo.ts';
import { PrismaClient } from '@prisma/client';
import { createComparisonResultResponse } from '../restresponse.ts';
import { createPrismaClient } from '../database/prisma/client.ts';
import express from 'express';
import { getLoaderFromPrisma } from '../loaders.ts';
import { retrieveComparisonResults } from '../database/comparisonResults.ts';

const retrieveComparisonsForUser = async <
  IdType extends CollectionObjectId>(
  client: PrismaClient,
  collectionId: CollectionIdType,
  userId: UserId,
  maxComparisons?: number): Promise<ComparisonResult<IdType>[]> => {
  return retrieveComparisonResults(client, collectionId, userId, maxComparisons);
};

export const recent = async <
IdType extends CollectionObjectId, CollectionObjectType extends CollectionObject<IdType>>(
  request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType) => {
  try {
    const userId: UserId = request.session.userId;
    const loader: CollectionTypeLoader<IdType, CollectionObjectType> = await getLoaderFromPrisma(
      request.app.locals.prismaClient, loaderId
    );

    // const connectionPromise: DatabaseConnection = request.app.locals.connectionPromise;

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

    const client: PrismaClient = request.app.locals.prismaClient || createPrismaClient();

    return await retrieveComparisonsForUser<IdType>(
      client,
      loader.collectionId,
      userId,
      maxComparisons
    ).then((comparisons: ComparisonResult<IdType>[]) => {
      response.contentType('application/json');
      const responseJson = createComparisonResultResponse<IdType, CollectionObjectType>(comparisons, loader);
      response.send(responseJson);
      return response.end();
    }).catch((err: Error) => {
      return response.status(500).send({ message: err.message }).end();
    });
  } catch (_err) {
    return response.status(500).send({ message: 'error' }).end();
  }
};
