import { FieldPacket, QueryResult, mysqlQuery } from "@tjsr/mysql-pool-utils";

import { CollectionTypeData } from "./mysql.js";
import { DatabaseConnection } from "../types.js";

/**
 * @deprecated Use CollectionStore.findAll instead.
 */
export const _retrieveCollections = async(useConn: DatabaseConnection):
Promise<CollectionTypeData[]> => {
  return mysqlQuery(
    `SELECT collectionId, name, datasource, description, cachedData, lastUpdateTime, maxElementsPerComparison
    FROM Collection`, [], useConn)
    .then(([queryResult, _fieldPacket]: [QueryResult, FieldPacket[]]) => {
      const results = queryResult as any[];
      // (err, results) => {
      if (results == undefined || results.length <= 0) {
        // conn.release();
        // return reject(
        throw new Error(
          `No Collections were present in config table.`
        );
        // );
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
      return collectionConfigs;
    });
};
