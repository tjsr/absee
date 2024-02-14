import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectEloRating,
  CollectionObjectId,
  ComparisonElement,
  ComparisonElementResponse,
  ComparisonResult,
  EloTimeline,
  EloTimelineResponse
} from '../types.js';

import { ABSeeRequest } from '../session.js';
import { CollectionTypeLoader } from '../datainfo.js';
import { createEloTimelineFromComparisons } from '../restresponse.js';
import express from 'express';
import { getLoader } from '../loaders.js';
import { retrieveComparisonResults } from '../database/mysql.js';

const MAX_ELO_COMPARISONS = 99999;

const createObjectFromId = <
T extends CollectionObject<IdType>,
IdType extends CollectionObjectId
> (objectId: CollectionObjectId): T => {
  const output: CollectionObject<IdType> = {
    id: idStringToCollectionObjectId<IdType>(objectId),
  };
  return output as T;
};

const idStringToCollectionObjectId = <CollectionObjectIdType extends CollectionObjectId>(
  idString: CollectionObjectId
): CollectionObjectIdType => {
  return idString as unknown as CollectionObjectIdType;
};

const convertElementIdsToCollectionObjects = <
  CollectionObjectType extends CollectionObject<IdType>,
  IdType extends CollectionObjectId
  > (
    objects: CollectionObjectId[]
  ): CollectionObjectType[] => {
  return objects.map((objectId: CollectionObjectId) => createObjectFromId(objectId));
};

const roundEloValues = <ET extends CollectionObjectEloRating<IdType>[], IdType extends CollectionObjectId>(
  values: ET): CollectionObjectEloRating<IdType>[] => {
  return values.map((et) => {
    return {
      ...et,
      rating: Math.round(et.rating),
    };
  });
};

const convertTimelineToResponse = <
CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>
  (timeline: EloTimeline<IdType>[], loader: CollectionTypeLoader<CollectionObjectType, any, IdType>):
  EloTimelineResponse<CollectionObjectType, IdType>[] => {
  return timeline
    .sort((te1, te2) => te1.requestTime.getTime() - te2.requestTime.getTime())
    .map((timelineEntry) => {
      const elements: ComparisonElementResponse<CollectionObjectType, IdType>[] =
      timelineEntry.elements.map((ce: ComparisonElement<IdType>) => {
        const response: ComparisonElementResponse<CollectionObjectType, IdType> = {
          data: convertElementIdsToCollectionObjects(ce.objectIds),
          elementId: ce.elementId,
        };
        return response;
      });

      const responseElement: EloTimelineResponse<CollectionObjectType, IdType> = {
        collectionObjects: timelineEntry.elements.flatMap((et) => et.objectIds).map(
          (objectId) => loader.getObjectForId(loader.collectionData, objectId)),
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

export const elo = async <CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionIdType>(
  request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType
) => {
  try {
    const loader: CollectionTypeLoader<CollectionObjectType, any, IdType> = await getLoader(loaderId);

    retrieveComparisonResults(
      loader.collectionId, undefined, MAX_ELO_COMPARISONS
    ).then((comparisons: ComparisonResult<IdType>[]) => {
      response.contentType('application/json');
      const timelineJson: EloTimeline<IdType>[] = createEloTimelineFromComparisons(comparisons);
      const responseJson: EloTimelineResponse<CollectionObjectType, IdType>[] =
        convertTimelineToResponse(timelineJson, loader);
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
