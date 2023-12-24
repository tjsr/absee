import { ComparisonResult, EmailAddress, SnowflakeType } from '../types';
import { PoolConnection, getConnection } from './mysqlConnections';

import { ComparisonRequestResponseBody } from '../types/datasource';
import { RowDataPacket } from 'mysql2';
import { UserModel } from '../types/model';
import { createUserIdFromEmail } from '../auth/user';

export type { PoolConnection };

const snowflakeToSqlId = (snowflake: SnowflakeType): BigInt => {
  return BigInt(snowflake);
};

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};

// const retrieve

const populateElementsFromDatabase = async <T>(
  conn: PoolConnection,
  comparisonResults: ComparisonResult<T>[]
): Promise<ComparisonResult<T>[]> => {
  const resultMap: Map<SnowflakeType, ComparisonResult<T>> = new Map();
  comparisonResults.forEach((cr) => {
    resultMap.set(cr.id, cr);
  });

  const comparisonIds: BigInt[] = comparisonResults.map((cr) => snowflakeToSqlId(cr.id));
  return new Promise((resolve, reject) => {
    // console.log(`Selecting ${JSON.stringify(comparisonIds)}`);
    const ids: string = comparisonIds.join(',');
    conn.query(
      `SELECT CE.comparisonId, CE.objectId, CE.elementId, CE.id as comparisonElementId 
       FROM ComparisonElement CE
       WHERE CE.comparisonId IN (${ids})`,
      (elementErr: any, elementResults: any[], elementFields) => {
        // console.log(`elementFields: ${JSON.stringify(elementFields)}`);
        console.log(`Got ${JSON.stringify(elementResults)} elements for IDs ${comparisonIds}`);
        if (elementErr) {
          return reject(elementErr);
        }
        // : {comparisonId: BigInt, objectId: string, elementId: BigInt}
        elementResults.forEach((elementRow: RowDataPacket, index, arrayValues) => {
          const cr: ComparisonResult<T> | undefined = resultMap.get(elementRow.comparisonId);
          if (cr) {
            if (!cr.elements) {
              cr.elements = [];
            }
            const element = cr?.elements.find((element) => element.elementId == elementRow.elementId);
            if (element) {
              element.data.push(elementRow.objectId);
            } else {
              cr?.elements.push({
                data: [elementRow.objectId],
                elementId: elementRow.elementId,
              });
            }
          }
        });
        return resolve(comparisonResults);
      });
  });
};

export const retrieveComparisonResults = async <T>(): Promise<ComparisonResult<T>[]> => {
  const conn = await getConnection();

  return new Promise<ComparisonResult<T>[]>((resolve, reject) => {
    try {
      conn.query(
        `select C.id as comparisonId, C.collectionId, C.userId, C.requestTime, CR.selectedComparisonElementId
         FROM Comparison C 
         LEFT JOIN ComparisonResponse CR ON C.id = CR.id 
         LEFT JOIN User U ON U.id = C.userId
         WHERE CR.selectedComparisonElementId IS NOT NULL
         ORDER BY C.requestTime DESC
         LIMIT 10`,
        (comparisonErr, comparisonResults, fields) => {
          console.log(`Fields: ${JSON.stringify(fields)}`);
          if (comparisonResults == undefined) {
            conn.release();
            return reject(
              new Error(
                `Retrieving comparison results was undefined.`
              )
            );
          } else {
            const outputResults: ComparisonResult<T>[] = comparisonResults.map((result: any) => {
              return {
                id: result.comparisonId,
                requestTime: result.requestTime,
                userId: result.userId,
                winner: result.selectedComparisonElementId,
              };
            });
            populateElementsFromDatabase(conn, outputResults).then((results) => {
              conn.release();
              return resolve(results);
            }).catch((err) => {
              conn.release();
              return reject(err);
            });
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

export const retrieveComparisonRequest = async (
  comparisonId: SnowflakeType
): Promise<ComparisonRequestResponseBody> => {
  const conn = await getConnection();

  return new Promise((resolve, reject) => {
    try {
      conn.query(
        `SELECT id, collectionId, userId, requestTime, requestIp
        FROM Comparison
        WHERE id=?`,
        [comparisonId],
        (err, results, fields) => {
          if (err) {
            conn.release();
            return reject(err);
          }
          if (results == undefined) {
            conn.release();
            return reject(
              new Error(
                `Retrieving by comparisonId ${comparisonId} results was undefined.`
              )
            );
          }
          if (results.length != 1) {
            conn.release();
            return reject(
              new Error(
                `Retrieving by comparisonId ${comparisonId} should only ever ` +
                  `return a single row, got ${results.length}`
              )
            );
          }
          const data: ComparisonRequestResponseBody = {
            collectionId: results[0].collectionId,
            id: results[0].id,
            requestIp: results[0].requestIp,
            requestTime: results[0].requestTime,
            userId: results[0].userId,
          };
          resolve(data);
          conn.release();
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};
