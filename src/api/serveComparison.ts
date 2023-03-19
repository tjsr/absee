import { ComparableObjectModel, ComparisonModel } from "../types/model";
import { ComparisonSelectionResponse, SnowflakeType, UserId } from "../types";

import { CollectionTypeLoader } from "../datainfo";
import SuperJSON from "superjson";
import { createCandidateElementList } from "../utils";
import { createComparableObjectList } from "../comparableobjects";
import { createComparisonSelection } from "../datastore";
import { createComparisonSelectionResponse } from "../restresponse";
import express from 'express';
import { getIp } from "../server";
import { getSnowflake } from "../snowflake";
import { getUserId } from "../auth/user";
import { storeComparisonRequest } from "../comparison";

export const serveComparison = <T, D>(loader: CollectionTypeLoader<T, D>, request: express.Request, response: express.Response) => {
  try {
    const userId: UserId = getUserId(request);
    const ipAddress = getIp(request);
    const comparisonId: SnowflakeType = getSnowflake();
    console.log(`Got request from userId ${userId}`);

    const candidateElements: [string[], string[]] = createCandidateElementList(loader, loader.getNumberOfElements(loader),loader.maxElementsPerComparison, loader.maxElementsPerComparison);

    const left: ComparableObjectModel<T>[] = createComparableObjectList<T>(candidateElements[0], comparisonId);
    const right: ComparableObjectModel<T>[] = createComparableObjectList<T>(candidateElements[1], comparisonId);
    const comparisonRequest: ComparisonModel<T> = createComparisonSelection<T>(loader.collectionId, comparisonId, userId, ipAddress, left, right);
    storeComparisonRequest(comparisonRequest).then(() => {
      response.contentType('application/json');
      const responseJson: ComparisonSelectionResponse<T> = createComparisonSelectionResponse<T>(comparisonRequest, loader);
      response.send(SuperJSON.stringify(responseJson));
    }).catch((err: Error) => {
      console.error('Failed while storing comparisonRequest in DB');
      console.error(SuperJSON.stringify(comparisonRequest));
      response.status(500);
      console.error(err);
      response.send(err.message);
      response.end();
    });
    // Return two random options from the configured collection.
  } catch (err) {
    console.warn(`Failure in GET /`, err);
  }
}