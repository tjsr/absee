import {
  CollectionIdType,
  CollectionObjectId,
  ComparisonElementId,
  ComparisonId,
  ComparisonResult,
  DatabaseConnection,
  EmailAddress,
  SnowflakeType,
  UserId,
  uuid5
} from '../types.js';
import { Comparison, ComparisonResponse } from '@prisma/client';
import { FieldPacket, PoolConnection, QueryResult, getConnection, mysqlQuery, safeReleaseConnection } from '@tjsr/mysql-pool-utils';

import { ComparisonRequestResponseBody } from '../types/datasource.js';
import { UserModel } from '../types/model.js';
import { createUserIdFromEmail } from '../auth/user.js';

type ComparisonElementsQueryResult = [ComparisonId, CollectionObjectId, ComparisonElementId, ComparisonElementId];
type ComparisonResponseQueryResultRow = Pick<Comparison, 'id' | 'collectionId' | 'userId' | 'requestTime'> & ComparisonResponse['selectedComparisonElementId'];
type ComparisonResponseQueryResult = [ComparisonResponseQueryResultRow['id'],
ComparisonResponseQueryResultRow['collectionId'],
ComparisonResponseQueryResultRow['userId'],
ComparisonResponseQueryResultRow['requestTime'],
ComparisonResponse['selectedComparisonElementId']];

//CE.comparisonId, CE.objectId, CE.elementId, CE.id as comparisonElementId 

const snowflakeToSqlId = (snowflake: SnowflakeType): BigInt => {
  return BigInt(snowflake);
};

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};

const populateElementsFromDatabase = async <IdType extends CollectionObjectId>(
  conn: PoolConnection,
  comparisonResults: ComparisonResult<IdType>[]
): Promise<ComparisonResult<IdType>[]> => {
  if (comparisonResults.length == 0) {
    const errMessage = `comparisonResult in populateElementsFromDatabase was empty`;
    console.trace(errMessage);
    throw Error(errMessage);
  }

  const resultMap: Map<SnowflakeType, ComparisonResult<IdType>> = new Map();
  comparisonResults.forEach((cr) => {
    resultMap.set(cr.id, cr);
  });

  const comparisonIds: BigInt[] = comparisonResults.map((cr) => snowflakeToSqlId(cr.id));
  return new Promise((resolve, reject) => {
    const ids: string = comparisonIds.join(',');
    mysqlQuery(
      `SELECT CE.comparisonId, CE.objectId, CE.elementId, CE.id as comparisonElementId 
       FROM ComparisonElement CE
       WHERE CE.comparisonId IN (${ids})`, [])
       .then(([queryResults, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
        const elementResults: ComparisonElementsQueryResult[] = queryResults as ComparisonElementsQueryResult[];

        elementResults.map((elementRow: ComparisonElementsQueryResult) => {
          const cr: ComparisonResult<IdType> | undefined = resultMap.get(elementRow[0]);
          if (cr) {
            if (!cr.elements) {
              cr.elements = [];
            }
            const element = cr?.elements.find((element) => element.elementId == elementRow[2]);
            if (element) {
              element.objectIds.push(elementRow[1] as IdType);
            } else {
              cr?.elements.push({
                elementId: elementRow[2],
                objectIds: [elementRow[1] as IdType],
              });
            }
          }
        });
        return resolve(comparisonResults);
      }).catch((elementErr) => {
        if (elementErr) {
          console.error(`Error while retrieving elements for comparison IDs ${comparisonIds}`, elementErr);
          conn.release();
          return reject(elementErr);
        }
      });
  });
};

export const retrieveComparisonResults = async <IdType extends CollectionObjectId>(
  collectionId: CollectionIdType,
  userId?: UserId,
  maxComparisons = 50
): Promise<ComparisonResult<IdType>[]> => {
  if (collectionId === undefined) {
    throw Error(`Can't call retrieveComparisonResults when collectionId is undefined`);
  }
  const useConn = getConnection();
  const conn = await useConn;

  return new Promise<ComparisonResult<IdType>[]>((resolve, reject) => {
    try {
      const queryParams = [collectionId];

      const baseSelect = `select
        C.id, C.collectionId, C.userId, C.requestTime, CR.selectedComparisonElementId
         FROM Comparison C 
         LEFT JOIN ComparisonResponse CR ON C.id = CR.id 
         LEFT JOIN User U ON U.id = C.userId`;
      let whereClause = `WHERE CR.selectedComparisonElementId IS NOT NULL
        AND C.collectionId = ?`;
      if (userId) {
        whereClause += ' AND C.userId = ?';
        queryParams.push(userId);
      }
      const query = `${baseSelect} ${whereClause}
         ORDER BY C.requestTime DESC
         LIMIT ${maxComparisons}`;

      mysqlQuery(query,
        queryParams, useConn)
        .then(([queryResult, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
          const comparisonResults: ComparisonResponseQueryResult[] = queryResult as ComparisonResponseQueryResult[];
        // (comparisonErr, comparisonResults) => {
          // console.log(`Fields: ${JSON.stringify(fields)}`);
          if (comparisonResults.length == 0) {
            const errorMessage = `No comparison results were returned for collection ${collectionId}.`;
            console.error(errorMessage);
            return reject(
              new Error(errorMessage)
            );
          } else {
            const outputResults: ComparisonResult<IdType>[] = comparisonResults.map((result: any) => {
              return {
                elements: [],
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
      ).catch((comparisonErr) => {
        if (comparisonErr) {
          safeReleaseConnection(conn)
          let errMsg = `Failed while retrieving comparison results for collection ${collectionId}`;
          if (userId) {
            errMsg += ` and userId ${userId}`;
          }
          console.error(errMsg, comparisonErr);
          return reject(comparisonErr);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const retrieveComparisonRequest = async (
  conn: DatabaseConnection,
  comparisonId: SnowflakeType
): Promise<ComparisonRequestResponseBody> => {
  return mysqlQuery(
    `SELECT id, collectionId, userId, requestTime, requestIp
    FROM Comparison
    WHERE id=?`,
    [comparisonId], conn).then(([queryResult, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
    // (err, results) => {
    const results = queryResult as Comparison[];
    if (results.length != 1) {
      throw new Error(
        `Retrieving by comparisonId ${comparisonId} should only ever ` +
          `return a single row, got ${results.length}`
      );
    }
    const data: ComparisonRequestResponseBody = {
      collectionId: results[0].collectionId,
      id: results[0].id,
      requestIp: results[0].requestIp,
      requestTime: results[0].requestTime,
      userId: results[0].userId,
    };
    return data;
  });
};

export type CollectionTypeData = {
  collectionId: uuid5;
  name: string,
  datasource: string;
  description: string;
  cachedData: string;
  lastUpdateTime: Date;
  maxElementsPerComparison: number;
}

export const retrieveCollections = async():
  Promise<CollectionTypeData[]> => {
  const conn = await getConnection();

  return new Promise((resolve, reject) => {
    try {
      mysqlQuery(
        `SELECT collectionId, name, datasource, description, cachedData, lastUpdateTime, maxElementsPerComparison
        FROM Collection`, [])
      .then(([queryResult, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
        const results = queryResult as any[];
       // (err, results) => {        
          if (results == undefined || results.length <= 0) {
            conn.release();
            return reject(
              new Error(
                `No Collections were present in config table.`
              )
            );
          }
          const collectionConfigs: CollectionTypeData[] =
            results.map((result: any) => {
              return {
                cachedData: result.cachedData,
                collectionId: result.collectionId,
                datasource: result.datasource,
                description: result.description,
                lastUpdateTime: new Date(result.lastUpdateTime),
                maxElementsPerComparison: result.maxElementsPerComparison,
                name: result.name,
              };
            });
          safeReleaseConnection(conn);
          resolve(collectionConfigs);
        }
      ).catch((err)  => {
        safeReleaseConnection(conn);
        return reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};
