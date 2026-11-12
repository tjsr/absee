import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectEloRating,
  CollectionObjectId,
  ComparisonResult,
  EloTimeline,
  EloTimelineResponse
} from '../types.ts';

import { ABSeeRequest } from '../session.ts';
import { CollectionTypeLoader } from '../datainfo.ts';
import { createEloTimelineFromComparisons } from '../restresponse.ts';
import { createPrismaClient } from '../database/prisma/client.ts';
import express from 'express';
import { getLoaderFromPrisma } from '../loaders.ts';
import { retrieveComparisonResults } from '../database/comparisonResults.ts';

const MAX_ELO_COMPARISONS = 99999;

// const createObjectFromId = <
// T extends CollectionObject<IdType>,
// IdType extends CollectionObjectId
// > (objectId: CollectionObjectId): T => {
//   const output: CollectionObject<IdType> = {
//     id: idStringToCollectionObjectId<IdType>(objectId),
//   };
//   return output as T;
// };

// const idStringToCollectionObjectId = <CollectionObjectIdType extends CollectionObjectId>(
//   idString: CollectionObjectId
// ): CollectionObjectIdType => {
//   return idString as unknown as CollectionObjectIdType;
// };

// const convertElementIdsToCollectionObjects = <
//   CollectionObjectType extends CollectionObject<IdType>,
//   IdType extends CollectionObjectId
//   > (
//     objects: CollectionObjectId[]
//   ): CollectionObjectType[] => {
//   return objects.map((objectId: CollectionObjectId) => createObjectFromId(objectId));
// };

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
  (timeline: EloTimeline<IdType>[], loader: CollectionTypeLoader<IdType, CollectionObjectType>):
  EloTimelineResponse<CollectionObjectType, IdType>[] => {
  return timeline
    .sort((te1, te2) => te1.requestTime.getTime() - te2.requestTime.getTime())
    .map((timelineEntry) => {
      const responseElement: EloTimelineResponse<CollectionObjectType, IdType> = {
        collectionObjects: timelineEntry.elements.flatMap((et) => et.objectId).map(
          (objectId) => loader.getObjectForId(loader.collectionData, objectId)),
        elements: [...timelineEntry.elements],
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

export const elo = async <
CollectionObjectType extends CollectionObject<IdType>,
IdType extends CollectionIdType = CollectionIdType,
>(
  request: ABSeeRequest, response: express.Response, loaderId: CollectionIdType
) => {
  try {
    const prismaClient = request.app.locals.prismaClient || createPrismaClient();
    const loader: CollectionTypeLoader<IdType, CollectionObjectType> =
      await getLoaderFromPrisma(prismaClient, loaderId);

    retrieveComparisonResults(
      prismaClient,
      loader.collectionId, undefined, MAX_ELO_COMPARISONS
    ).then((comparisons: ComparisonResult<string>[]) => {
      response.contentType('application/json');
      const timelineJson: EloTimeline<IdType>[] =
        createEloTimelineFromComparisons(comparisons) as EloTimeline<IdType>[];
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
  } catch (_err) {
    response.status(500);
    response.send({ message: 'error' });
    response.end();
  }
};
