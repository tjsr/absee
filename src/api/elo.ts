import {
  CollectionIdType,
  CollectionObjectIdType,
  CollectionObjectType,
  ComparisonElement,
  ComparisonElementResponse,
  ComparisonResult,
  ElementEloRating,
  EloTimeline,
  EloTimelineResponse,
  SnowflakeType
} from '../types.js';

import { ABSeeRequest } from '../session.js';
import { CollectionTypeLoader } from '../datainfo.js';
import { createEloTimelineFromComparisons } from '../restresponse.js';
import express from 'express';
import { getLoader } from '../loaders.js';
import { retrieveComparisonResults } from '../database/mysql.js';

const MAX_ELO_COMPARISONS = 99999;

const createObjectFromId = <
T extends CollectionObjectType<CID>,
CID extends CollectionObjectIdType
> (objectId: string): T => {
  const output: CollectionObjectType<CID> = {
    id: idStringToCollectionObjectId<CID>(objectId),
  };
  return output as T;
};

const idStringToCollectionObjectId = <CollectionObjectId extends CollectionObjectIdType>(
  idString: string
): CollectionObjectId => {
  return idString as unknown as CollectionObjectId;
};

const convertElementIdsToCollectionObjects = <
  T extends CollectionObjectType<CID>,
  CID extends CollectionObjectIdType
  > (
    objects: string[]
  ): T[] => {
  return objects.map((objectId: string) => createObjectFromId(objectId));
};

const roundEloValues = <ET extends ElementEloRating<IDType>[], IDType>(values: ET): ElementEloRating<IDType>[] => {
  return values.map((et) => {
    return {
      ...et,
      rating: Math.round(et.rating),
    };
  });
};

const convertTimelineToResponse = <T extends CollectionObjectType<IDType>, IDType extends SnowflakeType|object|number>
  (timeline: EloTimeline<IDType>[]): EloTimelineResponse<T, IDType>[] => {
  return timeline.map((timelineEntry) => {
    const elements: ComparisonElementResponse<T>[] = timelineEntry.elements.map((ce: ComparisonElement) => {
      const response: ComparisonElementResponse<T> = {
        data: convertElementIdsToCollectionObjects(ce.objects),
        elementId: ce.elementId,
      };
      return response;
    });

    const responseElement: EloTimelineResponse<T, IDType> = {
      elements: elements,
      eloRatingsAfter: roundEloValues(timelineEntry.eloRatingsAfter),
      eloRatingsBefore: roundEloValues(timelineEntry.eloRatingsBefore),
      id: timelineEntry.id,
      requestTime: timelineEntry.requestTime,
      userId: timelineEntry.userId,
      winner: timelineEntry.winner,
    };
    return responseElement;
  });
};

export const elo = async <T extends CollectionObjectType<IDType>, IDType extends SnowflakeType|string|number>(
  request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType
) => {
  try {
    const loader: CollectionTypeLoader<T, IDType> = await getLoader(loaderId);

    retrieveComparisonResults(
      loader.collectionId, undefined, MAX_ELO_COMPARISONS
    ).then((comparisons: ComparisonResult[]) => {
      response.contentType('application/json');
      const timelineJson: EloTimeline<IDType>[] = createEloTimelineFromComparisons(comparisons);
      const responseJson: EloTimelineResponse<T, IDType>[] =
        convertTimelineToResponse(timelineJson);
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
