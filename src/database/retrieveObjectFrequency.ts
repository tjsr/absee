import { getConnection } from './mysqlConnections';

export const retrieveObjectFrequency = async(collectionId: string): Promise<Map<string, number>> => {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    try {
      conn.query(
        `SELECT CE.objectId, count(*) AS ComparisonCount
        FROM ComparisonElement CE
        LEFT JOIN Comparison C ON CE.comparisonId = C.id
        WHERE C.collectionId = ?
        GROUP BY objectId ORDER BY COUNT(CE.objectId) ASC`,
        [collectionId],
        (elementErr: any, elementResults: any[]) => {
          if (elementErr) {
            console.error(`Error while retrieving object frequency for collection ${collectionId}`, elementErr);
            conn.release();
            return reject(elementErr);
          }
          const result: Map<string, number> = new Map<string, number>;
          elementResults.forEach((row) => {
            result.set(row.objectId, parseInt(row.ComparisonCount));
          });
          conn.release();
          resolve(result);
        });
    } catch (err) {
      reject(err);
    }
  });
};
