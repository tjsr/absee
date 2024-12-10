import { FieldPacket, mysqlQuery, QueryResult } from '@tjsr/mysql-pool-utils';
import { ComparisonElement } from '@prisma/client';
import { DatabaseConnection } from '../types.js';

type ComparisonElementsCountQueryResult = {
  objectId: ComparisonElement['objectId'];
  ComparisonCount: number;
};

export const retrieveObjectFrequency = async(
  conn: DatabaseConnection, collectionId: string
): Promise<Map<string, number>> => {
  return mysqlQuery(
    `SELECT CE.objectId, count(*) AS ComparisonCount
    FROM ComparisonElement CE
    LEFT JOIN Comparison C ON CE.comparisonId = C.id
    WHERE C.collectionId = ?
    GROUP BY objectId ORDER BY COUNT(CE.objectId) ASC`,
    [collectionId], conn)
    .then(([queryResults, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
      const elementResults: ComparisonElementsCountQueryResult[] = queryResults as ComparisonElementsCountQueryResult[];
      const result: Map<string, number> = new Map<string, number>;
      elementResults.forEach((row) => {
        result.set(row.objectId, row.ComparisonCount);
      });
      return result;

    }).catch((elementErr) => {
      console.error(`Error while retrieving object frequency for collection ${collectionId}`, elementErr);
      throw elementErr;
  });
};
