import { CollectionDataValidationError, CollectionTypeLoader } from '../datainfo.js';
import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonSelectionResponse,
  SnowflakeType
} from '../types.js';
import { ComparableObjectModel, ComparisonModel } from '../types/model.js';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from '../ui/utils.js';

import { LoaderNotFoundError } from '../types/errortypes.js';
import SuperJSON from 'superjson';
import { createCandidateElementList } from '../utils.js';
import { createComparableObjectList } from '../comparableobjects.js';
import { createComparisonSelection } from '../datastore.js';
import { createComparisonSelectionResponse } from '../restresponse.js';
import express from 'express';
import { getIp } from '../server.js';
import { getSnowflake } from '../snowflake.js';
import { getUserIdentificationString } from '../auth/user.js';
import { populatePrioritizedObjectList } from '../populatePrioritizedObjectList.js';
import { storeComparisonRequest } from '../comparison.js';

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

export const serveComparison = async <
CollectionObjectType extends CollectionObject<IdType>, _D, IdType extends CollectionObjectId>(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
  collectionId: CollectionIdType
): Promise<void> => {
  if (!response.locals.connectionPromise) {
    const noConnectionError = new Error('Response requires connection pool handle but none available');
    console.error(serveComparison, noConnectionError);
    response.status(500);
    next(noConnectionError);
    return Promise.resolve();
  }
  try {
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
    let leftElements: IdType[]|undefined = undefined;
    let rightElements: IdType[]|undefined = undefined;

    if (queryStringGroups?.length == 2) {
      leftElements = queryStringGroups[0].split(QUERYSTRING_ELEMENT_DELIMETER) as IdType[];
      rightElements = queryStringGroups[1].split(QUERYSTRING_ELEMENT_DELIMETER) as IdType[];
      console.debug(serveComparison,
        `Serving comparison request ${comparisonId} to userId ${userId} (${idString}) `+
        `with predefined set ${leftElements} vs ${rightElements}}`);
    } else {
      console.debug(serveComparison,
        `Serving comparison request ${comparisonId} to userId ${userId} (${idString})`
      );

      if (loader.prioritizedObjectIdList === undefined ||
        loader.prioritizedObjectIdList.length <= MINIMUM_PRIORITIZED_OBJECTS) {
        try {
          await populatePrioritizedObjectList(response.locals.connectionPromise, loader);
        } catch (err: any) {
          // safeReleaseConnection(conn);
          console.error('Failed geting object list from DB');
          response.contentType('application/json');
          response.status(500);
          console.error(err);
          response.send(err.message);
          response.end();
          return;
        }
      }

      const candidateElements: [IdType[], IdType[]] = createCandidateElementList(
        loader,
        loader.maxElementsPerComparison,
        loader.maxElementsPerComparison
      );
      leftElements = candidateElements[0];
      rightElements = candidateElements[1];
    }

    console.debug(serveComparison, 'Got element candidate lists for left and right elements');

    const left: ComparableObjectModel<IdType>[] = createComparableObjectList(
      leftElements
    );
    const right: ComparableObjectModel<IdType>[] = createComparableObjectList(
      rightElements
    );
    const comparisonRequest: ComparisonModel<IdType> = createComparisonSelection(
      loader.collectionId,
      comparisonId,
      userId,
      ipAddress,
      left,
      right
    );
    console.debug(serveComparison, 'Storing comparison request', comparisonId);
    storeComparisonRequest(response.locals.connectionPromise, comparisonRequest)
      .then(() => {
        console.debug(serveComparison, 'Finished storing new comparison request', comparisonId);
        response.contentType('application/json');
        const responseJson: ComparisonSelectionResponse<CollectionObjectType> =
          createComparisonSelectionResponse<CollectionObjectType, IdType>(comparisonRequest, loader);
        response.send(SuperJSON.stringify(responseJson));
        response.end();
      })
      .catch((err: Error) => {
        console.error('Failed while storing comparisonRequest in DB');
        console.error(SuperJSON.stringify(comparisonRequest));
        response.contentType('application/json');
        response.status(500);
        console.error(err);
        response.send(err.message);
        response.end();
      });
    // Return two random options from the configured collection.
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
      return;
    }

    response.status(500);
    response.send();
    response.end();
    console.warn(`Failure in GET /`, err);
  }
};
