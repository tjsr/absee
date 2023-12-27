import { ComparisonResult, EmailAddress, SnowflakeType, UserId } from '../types';
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

const populateElementsFromDatabase = async (
  conn: PoolConnection,
  comparisonResults: ComparisonResult[]
): Promise<ComparisonResult[]> => {
  const resultMap: Map<SnowflakeType, ComparisonResult> = new Map();
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
      (elementErr: any, elementResults: any[]) => {
        // console.log(`elementFields: ${JSON.stringify(elementFields)}`);
        console.log(`Got ${JSON.stringify(elementResults)} elements for IDs ${comparisonIds}`);
        if (elementErr) {
          return reject(elementErr);
        }
        // : {comparisonId: BigInt, objectId: string, elementId: BigInt}
        elementResults.forEach((elementRow: RowDataPacket) => {
          const cr: ComparisonResult | undefined = resultMap.get(elementRow.comparisonId);
          if (cr) {
            if (!cr.elements) {
              cr.elements = [];
            }
            const element = cr?.elements.find((element) => element.elementId == elementRow.elementId);
            // const comparableObject: ComparableObjectModel = {
            //   elementId: elementRow.elementId,
            //   id: elementRow.comparisonElementId,
            //   objectId: elementRow.objectId,
            // };
            if (element) {
              // element.data.push(comparableObject);
              element.objects.push(elementRow.objectId);
            } else {
              cr?.elements.push({
                // data: [comparableObject],
                elementId: elementRow.elementId,
                objects: [elementRow.objectId],
              });
            }
          }
        });
        return resolve(comparisonResults);
      });
  });
};

export const retrieveComparisonResults = async (collectionId: string, userId?: UserId): Promise<ComparisonResult[]> => {
  const conn = await getConnection();

  return new Promise<ComparisonResult[]>((resolve, reject) => {
    try {
      //          ${userId ? 'AND C.userId = ?' : ''}
      //         [userId ? userId : undefined],
      conn.query(
        `select C.id as comparisonId, C.collectionId, C.userId, C.requestTime, CR.selectedComparisonElementId
         FROM Comparison C 
         LEFT JOIN ComparisonResponse CR ON C.id = CR.id 
         LEFT JOIN User U ON U.id = C.userId
         WHERE CR.selectedComparisonElementId IS NOT NULL
          AND C.collectionId = ?
         ORDER BY C.requestTime DESC
         LIMIT 10`,
        [collectionId],
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
            const outputResults: ComparisonResult[] = comparisonResults.map((result: any) => {
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
