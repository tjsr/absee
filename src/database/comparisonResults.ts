import { CollectionIdType, CollectionObjectId, ComparisonResult, UserId } from "../types.ts";

import { PrismaClient } from "@prisma/client";

// type ComparisonResponseQueryResultRow = Pick<
//   Comparison, 'id' | 'collectionId' | 'userId' | 'requestTime'
// > & ComparisonResponse['selectedComparisonElementId'];

// type _ComparisonResponseQueryResult = [ComparisonResponseQueryResultRow['id'],
// ComparisonResponseQueryResultRow['collectionId'],
// ComparisonResponseQueryResultRow['userId'],
// ComparisonResponseQueryResultRow['requestTime'],
// ComparisonResponse['selectedComparisonElementId']];

export const retrieveComparisonResults = async <IdType extends CollectionObjectId>(
  client: PrismaClient,
  collectionId: CollectionIdType,
  userId?: UserId,
  maxComparisons = 50
): Promise<ComparisonResult<IdType>[]> => {
  if (collectionId === undefined) {
    throw Error(`Can't call retrieveComparisonResults when collectionId is undefined`);
  }
  // const conn = await useConn;

  // const queryParams = [collectionId];

  // const query = client.comparison.findMany({
  //   include: {
  //     ComparisonResponse: true,
  //     }
  //   },
  //   where: {
  //     collectionId: collectionId,
  //     selectedComparisonElementId: { not: null},
  //   }
  // }).join.ComparisonResponse;
  // const baseSelect = `SELECT
  //   C.id, C.collectionId, C.userId, C.requestTime, CR.selectedComparisonElementId
  //     FROM Comparison C 
  //     LEFT JOIN ComparisonResponse CR ON C.id = CR.id 
  //     LEFT JOIN User U ON U.id = C.userId`;
  // let whereClause = `WHERE CR.selectedComparisonElementId IS NOT NULL
  //   AND C.collectionId = ?`;
  // if (userId) {
  //   whereClause += ' AND C.userId = ?';
  //   queryParams.push(userId);
  // }
  // const query = `${baseSelect} ${whereClause}
  //     ORDER BY C.requestTime DESC
  //     LIMIT ${maxComparisons}`;

  const comparisonResults = await client.comparison.findMany({
    include: {
      elements: true,
      responses: true,
      // ComparisonResponse: true,
      // User: true,
    },
    orderBy: {
      requestTime: 'desc',
    },
    take: maxComparisons,
    where: {
      collectionId: collectionId,
      responses: { some: {} },
      ...(userId ? { userId: userId } : {}),
    },
  });
  // return comparisonResults;
  // client.$queryRaw(query, queryParams);

  // return sqlQueryFunction(query, queryParams, useConn)
  //   .then(([queryResult, _fieldPacket]: [unknown, unknown[]]) => {
  //     const comparisonResults: ComparisonResponseQueryResult[] = queryResult as ComparisonResponseQueryResult[];

  if (comparisonResults.length == 0) {
    const errorMessage = `No comparison results were returned for collection ${collectionId}.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const outputResults: ComparisonResult<IdType>[] = comparisonResults.map((result: any) => {
    return {
      elements: result.elements.map((element: any) => ({
        id: element.id.toString(),
        comparisonId: element.comparisonId.toString(),
        elementId: element.elementId.toString(),
        objectId: element.objectId as IdType,
      })),
      id: result.id.toString(),
      requestTime: result.requestTime.toISOString(),
      userId: result.userId,
      winner: result.responses[0].selectedComparisonElementId.toString(),
    };
  });
  return outputResults;
  //   return populateElementsFromDatabase(client, outputResults, sqlQueryFunction);
  // }).catch((comparisonErr) => {
  //   safeReleaseConnection(conn);
  //   let errMsg = `Failed while retrieving comparison results for collection ${collectionId}`;
  //   if (userId) {
  //     errMsg += ` and userId ${userId}`;
  //   }
  //   console.error(errMsg, comparisonErr);
  //   throw comparisonErr;
  // });
};

