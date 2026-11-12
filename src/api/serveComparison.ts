import { CollectionDataValidationError, CollectionTypeLoader } from '../datainfo.ts';
import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonSelectionResponse,
  SnowflakeType
} from '../types.ts';
import { ComparableObjectModel, ComparisonModel } from '../types/model.ts';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from '../ui/utils.ts';

import { LoaderNotFoundError } from '../types/errortypes.ts';
import { PrismaClient } from '@prisma/client';
import SuperJSON from 'superjson';
import { createCandidateElementList } from '../utils.ts';
import { createComparableObjectList } from '../comparableobjects.ts';
import { createComparisonSelection } from '../datastore.ts';
import { createComparisonSelectionResponse } from '../restresponse.ts';
import express from 'express';
import { getIp } from '../server.ts';
import { getSnowflake } from '../snowflake.ts';
import { getUserIdentificationString } from '../auth/user.ts';
import { populatePrioritizedObjectList } from '../populatePrioritizedObjectList.ts';
import { storeComparisonRequest } from '../comparison.ts';

const MINIMUM_PRIORITIZED_OBJECTS = 100;

const checkLoaders = (loaders: CollectionTypeLoader<any, any, any>[], collectionId: CollectionIdType) => {
  if (loaders === undefined) {
    throw new LoaderNotFoundError(collectionId);
  }
  if (loaders.length === 0) {
    throw new LoaderNotFoundError(collectionId);
  }

  const loader = loaders.filter((l) => l.collectionId === collectionId)[0];
  if (!loader) {
    throw new LoaderNotFoundError(collectionId);
  }
  if (!loader.validateData(loader.collectionId, loader.name, loader.collectionData)) {
    throw new CollectionDataValidationError(loader.collectionId,
      'Collection data must be loaded before prioritized object list can be populated'
    );
  }
  return loader;
};

export const serveComparison = <
CollectionObjectType extends CollectionObject<IdType>, _D, IdType extends CollectionObjectId>(
    request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
    collectionId: CollectionIdType
  ): Promise<void> => {
  try {
    const prisma = request.app.locals.prismaClient as PrismaClient;
    const userId = request.session.userId;
    const idString: string = getUserIdentificationString(request);
    const ipAddress = getIp(request);

    const loader = checkLoaders(request.app.locals.loaders, collectionId);
    
    // const prisma = request.app.locals.prismaClient || new PrismaClient();
    // const loader = await getLoaderFromPrisma(prisma.collection, collectionId);
    
    // const collection: CollectionTypeLoader<CollectionObjectType, D, IdType> =
    //   await request.app.locals.prismaClient.collections.findUnique({
    //     where: {
    //       collectionId,
    //     },
    //   });
    // const collectionDs = new PrismaCollectionDataSource(prisma);
    // const collection = await collectionDs.getById(collectionId);
    const comparisonId: SnowflakeType = getSnowflake();
    const objectsQueryString = request.query.objects as string;
    const queryStringGroups:string[] = objectsQueryString?.split(QUERYSTRING_ARRAY_DELIMETER);
    let candidateElementsPromise: Promise<[IdType[], IdType[]]>;
    if (queryStringGroups?.length == 2) {
      const leftElements = queryStringGroups[0].split(QUERYSTRING_ELEMENT_DELIMETER) as IdType[];
      const rightElements = queryStringGroups[1].split(QUERYSTRING_ELEMENT_DELIMETER) as IdType[];
      console.debug(serveComparison,
        `Serving comparison request ${comparisonId} to userId ${userId} (${idString}) `+
        `with predefined set ${leftElements} vs ${rightElements}}`);
      candidateElementsPromise = Promise.resolve([leftElements, rightElements]);
    } else {
      console.debug(serveComparison,
        `Serving comparison request ${comparisonId} to userId ${userId} (${idString})`
      );

      const refreshPriorities = loader.prioritizedObjectIdList === undefined ||
        loader.prioritizedObjectIdList.length <= MINIMUM_PRIORITIZED_OBJECTS
        ? populatePrioritizedObjectList(prisma, loader) : Promise.resolve();
      candidateElementsPromise = refreshPriorities.then(() => createCandidateElementList(
        loader,
        loader.maxElementsPerComparison,
        loader.maxElementsPerComparison
      ));
    }

    return candidateElementsPromise.then(([leftElements, rightElements]) => {
      console.debug(serveComparison, 'Got element candidate lists for left and right elements');
      const left: ComparableObjectModel<IdType>[] = createComparableObjectList(leftElements);
      const right: ComparableObjectModel<IdType>[] = createComparableObjectList(rightElements);
      const comparisonRequest: ComparisonModel<IdType> = createComparisonSelection(
        loader.collectionId,
        comparisonId,
        userId,
        ipAddress,
        left,
        right
      );
      console.debug(serveComparison, 'Storing comparison request', comparisonId);
      return storeComparisonRequest(prisma, comparisonRequest).then(() => {
        console.debug(serveComparison, 'Finished storing new comparison request', comparisonId);
        response.contentType('application/json');
        const responseJson: ComparisonSelectionResponse<CollectionObjectType> =
          createComparisonSelectionResponse<CollectionObjectType, IdType>(comparisonRequest, loader);
        response.send(SuperJSON.stringify(responseJson));
        response.end();
      });
    }).catch((err: unknown) => {
      console.error('Failed while preparing or storing comparison request', err);
      response.contentType('application/json');
      response.status(500);
      response.send(err instanceof Error ? err.message : String(err));
      response.end();
    });
  } catch (err: unknown) {
    if (err instanceof LoaderNotFoundError) {
      console.warn(
        `Client tried to access loader for collection id ${collectionId}, but it wasn't found in the Database.`,
        err
      );
      response.status(404);
      response.send({
        errType: 'LoaderNotFoundError',
        loaderId: collectionId,
        message: err.message,
      });
      response.end();
      return Promise.resolve();
    }

    response.status(500);
    response.send();
    response.end();
    console.warn(`Failure in GET /`, err);
    return Promise.resolve();
  }
};
