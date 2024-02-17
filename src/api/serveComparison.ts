import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonSelectionResponse,
  SnowflakeType,
  UserId
} from '../types.js';
import { ComparableObjectModel, ComparisonModel } from '../types/model.js';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from '../ui/utils.js';
import { getUserId, getUserIdentificationString } from '../auth/user.js';

import { CollectionTypeLoader } from '../datainfo.js';
import SuperJSON from 'superjson';
import { createCandidateElementList } from '../utils.js';
import { createComparableObjectList } from '../comparableobjects.js';
import { createComparisonSelection } from '../datastore.js';
import { createComparisonSelectionResponse } from '../restresponse.js';
import express from 'express';
import { getIp } from '../server.js';
import { getLoader } from '../loaders.js';
import { getSnowflake } from '../snowflake.js';
import { populatePrioritizedObjectList } from '../populatePrioritizedObjectList.js';
import { storeComparisonRequest } from '../comparison.js';

const MINIMUM_PRIORITIZED_OBJECTS = 100;

export const serveComparison = async <
CollectionObjectType extends CollectionObject<IdType>, D, IdType extends CollectionObjectId>(
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
    let leftElements: IdType[]|undefined = undefined;
    let rightElements: IdType[]|undefined = undefined;

    const loader: CollectionTypeLoader<CollectionObjectType, D, IdType> = await getLoader(loaderId);
    if (queryStringGroups?.length == 2) {
      leftElements = queryStringGroups[0].split(QUERYSTRING_ELEMENT_DELIMETER) as IdType[];
      rightElements = queryStringGroups[1].split(QUERYSTRING_ELEMENT_DELIMETER) as IdType[];
      console.debug(`Serving comparison request ${comparisonId} to userId ${userId} (${idString}) `+
        `with predefined set ${leftElements} vs ${rightElements}}`);
    } else {
      console.debug(`Serving comparison request ${comparisonId} to userId ${userId} (${idString})`);

      if (loader.prioritizedObjectIdList === undefined ||
        loader.prioritizedObjectIdList.length <= MINIMUM_PRIORITIZED_OBJECTS) {
        await populatePrioritizedObjectList(loader);
      }

      const candidateElements: [IdType[], IdType[]] = createCandidateElementList(
        loader,
        loader.getNumberOfElements(loader),
        loader.maxElementsPerComparison,
        loader.maxElementsPerComparison
      );
      leftElements = candidateElements[0];
      rightElements = candidateElements[1];
    }

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
    storeComparisonRequest(comparisonRequest)
      .then(() => {
        response.contentType('application/json');
        const responseJson: ComparisonSelectionResponse<CollectionObjectType> =
          createComparisonSelectionResponse<CollectionObjectType, IdType>(comparisonRequest, loader);
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
