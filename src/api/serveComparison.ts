import { CollectionIdType, ComparisonSelectionResponse, SnowflakeType, UserId } from '../types';
import { ComparableObjectModel, ComparisonModel } from '../types/model';
import { getUserId, getUserIdentificationString } from '../auth/user';

import { CollectionTypeLoader } from '../datainfo';
import SuperJSON from 'superjson';
import { createCandidateElementList } from '../utils';
import { createComparableObjectList } from '../comparableobjects';
import { createComparisonSelection } from '../datastore';
import { createComparisonSelectionResponse } from '../restresponse';
import express from 'express';
import { getIp } from '../server';
import { getLoader } from '../loaders';
import { getSnowflake } from '../snowflake';
import { storeComparisonRequest } from '../comparison';

export const serveComparison = async <T, D>(
  request: express.Request,
  response: express.Response,
  loaderId: CollectionIdType
) => {
  try {
    const userId: UserId = getUserId(request);
    const idString: string = getUserIdentificationString(request);
    const ipAddress = getIp(request);
    const comparisonId: SnowflakeType = getSnowflake();
    console.debug(`Serving comparison request ${comparisonId} to userId ${userId} (${idString})`);

    const loader: CollectionTypeLoader<T, D> = await getLoader(loaderId);

    const candidateElements: [string[], string[]] = createCandidateElementList(
      loader,
      loader.getNumberOfElements(loader),
      loader.maxElementsPerComparison,
      loader.maxElementsPerComparison
    );

    const left: ComparableObjectModel[] = createComparableObjectList(
      candidateElements[0]
    );
    const right: ComparableObjectModel[] = createComparableObjectList(
      candidateElements[1]
    );
    const comparisonRequest: ComparisonModel = createComparisonSelection(
      loader.collectionId,
      comparisonId,
      userId,
      ipAddress,
      left,
      right
    );
    storeComparisonRequest(comparisonRequest)
      .then(() => {
        response.contentType('application/json');
        const responseJson: ComparisonSelectionResponse<T> =
          createComparisonSelectionResponse<T>(comparisonRequest, loader);
        response.send(SuperJSON.stringify(responseJson));
        response.end();
      })
      .catch((err: Error) => {
        console.error('Failed while storing comparisonRequest in DB');
        console.error(SuperJSON.stringify(comparisonRequest));
        response.status(500);
        console.error(err);
        response.send(err.message);
        response.end();
      });
    // Return two random options from the configured collection.
  } catch (err) {
    response.status(500);
    response.send();
    response.end();
    console.warn(`Failure in GET /`, err);
  }
};
