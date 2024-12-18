import { CollectionIdType, DatabaseConnection } from '../../types.js';
import { FieldPacket, QueryResult, mysqlQuery } from '@tjsr/mysql-pool-utils';

export interface StatsResponse {
  elementsCompared: number|undefined;
  mostFrequentlyComparedElement: string|undefined;
  mostFrequentlyComparedElementCount: number|undefined;
  usersContributed: number|undefined;
}

export const getElementsCompared = async (conn: DatabaseConnection, collectionId: string): Promise<number> => {
  const startTime: number = new Date().getTime();
  return mysqlQuery(
    `SELECT COUNT(*) AS comparisonsPerformed
    FROM ComparisonResponse CR
    LEFT JOIN ComparisonElement CE ON CE.elementId = CR.selectedComparisonElementId
    LEFT JOIN Comparison C ON C.id = CE.comparisonId
    WHERE C.collectionId = ?`,
    [collectionId], conn).then(([queryResults, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
    const results = queryResults as {comparisonsPerformed: number}[];

    const completionTime = (new Date().getTime()) - startTime;
    console.log(`Got elementsCompared stats: ${results[0].comparisonsPerformed} in ${completionTime}ms`);
    return results[0].comparisonsPerformed;
  })
    .catch((err: Error) => {
      console.error(`Error while getting elementsCompared stats`, err);
      throw err;
    });
};

export const getUniqueContibutingUserCount = async (
  conn: DatabaseConnection, collectionId: string
): Promise<number> => {
  const startTime: number = new Date().getTime();
  return mysqlQuery(`SELECT COUNT(distinct C.userId) as uniqueUsers
        FROM Comparison C
        WHERE C.collectionId = ?`,
  [collectionId],
  conn
  ).then(([queryResults, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
    const results = queryResults as {uniqueUsers: number}[];

    const completionTime = (new Date().getTime()) - startTime;
    console.log(`Got userCount stats: ${results[0].uniqueUsers} in ${completionTime}ms`);
    return results[0].uniqueUsers;
  }).catch((err: Error) => {
    console.error(`Error while getting userCount stats`, err);
    throw err;
  });
};

export const getMostFrequentlyComparedElement = async (
  conn: DatabaseConnection,
  collectionId: CollectionIdType
): Promise<[string, number]> => {
  const startTime: number = new Date().getTime();
  return mysqlQuery(`SELECT COUNT(CE.objectId) as objectIdCount, CE.objectId
    FROM ComparisonElement CE
    LEFT JOIN Comparison C ON CE.comparisonId = C.id
    WHERE C.collectionId = ?
    GROUP BY CE.objectId
    ORDER BY objectIdCount DESC
    LIMIT 1`, [collectionId], conn
  ).then(([queryResults, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
    const results = queryResults as {objectId: string, objectIdCount: number}[];

    const completionTime = (new Date().getTime()) - startTime;
    console.log(`Most frequent objectId: ${results[0].objectId} in ${completionTime}ms`);
    const output: [string, number] = [results[0].objectId, results[0].objectIdCount];
    return output;
  }).catch((err: Error) => {
    console.error(`Error while getting userCount stats`, err);
    throw err;
  });
};
