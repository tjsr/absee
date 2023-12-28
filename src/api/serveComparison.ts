import { CollectionIdType, ComparisonSelectionResponse, SnowflakeType, UserId } from '../types';
import { ComparableObjectModel, ComparisonModel } from '../types/model';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from '../ui/utils';
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
import { populatePrioritizedObjectList } from '../populatePrioritizedObjectList';
import { storeComparisonRequest } from '../comparison';

const MINIMUM_PRIORITIZED_OBJECTS = 100;

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
    const objectsQueryString = request.query.objects as string;
    const queryStringGroups:string[] = objectsQueryString?.split(QUERYSTRING_ARRAY_DELIMETER);
    let leftElements: string[]|undefined = undefined;
    let rightElements: string[]|undefined = undefined;

    const loader: CollectionTypeLoader<T, D> = await getLoader(loaderId);
    if (queryStringGroups?.length == 2) {
      leftElements = queryStringGroups[0].split(QUERYSTRING_ELEMENT_DELIMETER);
      rightElements = queryStringGroups[1].split(QUERYSTRING_ELEMENT_DELIMETER);
      console.debug(`Serving comparison request ${comparisonId} to userId ${userId} (${idString}) 
        with predefined set ${leftElements} vs ${rightElements}}`);
    } else {
      console.debug(`Serving comparison request ${comparisonId} to userId ${userId} (${idString})`);

      if (loader.prioritizedObjectIdList === undefined ||
        loader.prioritizedObjectIdList.length <= MINIMUM_PRIORITIZED_OBJECTS) {
        await populatePrioritizedObjectList(loader);
      }

      const candidateElements: [string[], string[]] = createCandidateElementList(
        loader,
        loader.getNumberOfElements(loader),
        loader.maxElementsPerComparison,
        loader.maxElementsPerComparison
      );
      leftElements = candidateElements[0];
      rightElements = candidateElements[1];
    }

    const left: ComparableObjectModel[] = createComparableObjectList(
      leftElements
    );
    const right: ComparableObjectModel[] = createComparableObjectList(
      rightElements
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
