import { CollectionIdType, ComparisonResult } from '../types.js';

import { ABSeeRequest } from '../session.js';
import { CollectionTypeLoader } from '../datainfo.js';
import { createEloTimelineFromComparisons } from '../restresponse.js';
import express from 'express';
import { getLoader } from '../loaders.js';
import { retrieveComparisonResults } from '../database/mysql.js';

export const elo = async <T, D>(request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType) => {
  try {
    const loader: CollectionTypeLoader<T, D> = await getLoader(loaderId);

    retrieveComparisonResults(
      loader.collectionId
    ).then((comparisons: ComparisonResult[]) => {
      response.contentType('application/json');
      const responseJson = createEloTimelineFromComparisons<T, D>(comparisons, loader);
      response.send(responseJson);
      response.end();
    }).catch((err: Error) => {
      response.status(500);
      response.send({ message: err.message });
      response.end();
    });

    // return retrieveComparisonResults(collectionId, userId, maxComparisons);
  } catch (err) {
    response.status(500);
    response.send({ message: 'error' });
    response.end();
  }
};
