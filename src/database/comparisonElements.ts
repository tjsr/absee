import {
  CollectionObjectId,
  ComparisonElementId,
  ComparisonId,
  ComparisonResult,
  SnowflakeType
} from "../types.ts";

import { PrismaClient } from "@prisma/client";
import { snowflakeToSqlId } from "./snowflake.ts";

export type ComparisonElementsQueryResult = [
  ComparisonId,
  CollectionObjectId,
  ComparisonElementId,
  ComparisonElementId
];

export const populateElementsFromDatabase = async <
  IdType extends CollectionObjectId
>(
  client: PrismaClient,
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

  const elements = await client.comparisonElement.findMany({
    where: {
      comparisonId: {
        in: comparisonResults
          .filter((cr) => cr.id !== undefined)
          .map((cr) => snowflakeToSqlId(cr.id)),
      },
    },
  });

  for (const row of elements) {
    const comparisonId = row.comparisonId.toString() as SnowflakeType;
    const result = resultMap.get(comparisonId);
    if (result === undefined) {
      continue;
    }
    result.elements.push({
      comparisonId,
      elementId: row.elementId.toString() as ComparisonElementId,
      id: row.id.toString() as SnowflakeType,
      objectId: row.objectId as IdType,
    });
  }

  return comparisonResults;
};
