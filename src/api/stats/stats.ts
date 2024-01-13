import { getConnection } from '../../database/mysqlConnections';

export interface StatsResponse {
  elementsCompared: number|undefined;
  mostFrequentlyComparedElement: string|undefined;
  mostFrequentlyComparedElementCount: number|undefined;
  usersContributed: number|undefined;
}

export const getElementsCompared = async (collectionId: string): Promise<number> => {
  const conn = await getConnection();
  return new Promise<number>((resolve, reject) => {
    try {
      conn.query(
        `SELECT COUNT(*) AS comparisonsPerformed
        FROM ComparisonResponse CR
        LEFT JOIN ComparisonElement CE ON CE.elementId = CR.selectedComparisonElementId
        LEFT JOIN Comparison C ON C.id = CE.comparisonId
        WHERE C.collectionId = ?`,
        [collectionId],
        (err: any, results: any[]) => {
          if (err) {
            console.error(`Error while getting elementsCompared stats`, err);
            conn.release();
            return reject(err);
          }
          conn.release();
          console.log(`Got elementsCompared stats: ${results[0].comparisonsPerformed}`);
          return resolve(results[0].comparisonsPerformed);
        });
    } catch (sqlErr) {
      reject(sqlErr);
    }
  });
};

export const getUniqueContibutingUserCount = async (collectionId: string): Promise<number> => {
  const conn = await getConnection();
  return new Promise<number>((resolve, reject) => {
    try {
      conn.query(`SELECT COUNT(distinct C.userId) as uniqueUsers
        FROM Comparison C
        WHERE C.collectionId = ?`,
      [collectionId],
      (err: any, results: any[]) => {
        if (err) {
          console.error(`Error while getting userCount stats`, err);
          conn.release();
          return reject(err);
        }
        conn.release();
        console.log(`Got userCount stats: ${results[0].uniqueUsers}`);
        return resolve(results[0].uniqueUsers);
      });
    } catch (sqlErr) {
      reject(sqlErr);
    }
  });
};

export const getMostFrequentlyComparedElement = async (collectionId: string): Promise<[string, number]> => {
  const conn = await getConnection();
  return new Promise<[string, number]>((resolve, reject) => {
    try {
      conn.query(`SELECT COUNT(CE.objectId) as objectIdCount, CE.objectId
        FROM ComparisonElement CE
        LEFT JOIN Comparison C ON CE.comparisonId = C.id
        WHERE C.collectionId = ?
        GROUP BY CE.objectId
        ORDER BY objectIdCount DESC
        LIMIT 1`,
      [collectionId],
      (err: any, results: any[]) => {
        if (err) {
          console.error(`Error while getting userCount stats`, err);
          conn.release();
          return reject(err);
        }
        conn.release();
        console.log(`Most frequent objectId: ${results[0].objectId}`);
        return resolve([results[0].objectId, results[0].objectIdCount]);
      });
    } catch (sqlErr) {
      reject(sqlErr);
    }
  });
};
