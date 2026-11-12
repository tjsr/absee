import { ComparisonId } from "../types.ts";
import { ComparisonRequestResponseBody } from "../types/datasource.ts";
import { PrismaClient } from "@prisma/client";

const snowflakeAsInt = (snowflake: ComparisonId): bigint => {
  return BigInt(snowflake);
};

export const retrieveComparisonRequest = async (
  prisma: PrismaClient,
  comparisonId: ComparisonId
): Promise<ComparisonRequestResponseBody> => prisma.comparison.findUnique({
  where: { id: snowflakeAsInt(comparisonId) },
}).then((result) => {
  if (result) {
    const data: ComparisonRequestResponseBody = {
      collectionId: result.collectionId,
      id: result.id,
      requestIp: result.requestIp,
      requestTime: result.requestTime,
      userId: result.userId,
    };
    return data;
  }
  throw new Error(`No comparison request found with id ${comparisonId}`);
});
  // return sqlQueryFunction(
  //   `SELECT id, collectionId, userId, requestTime, requestIp
  //   FROM Comparison
  //   WHERE id=?`,
  //   [comparisonId], conn).then(([queryResult, _fieldPacket]: QueryResultType<P, F>) => {
  //   // (err, results) => {
  //   const results = queryResult as Comparison[];
  //   if (results.length != 1) {
  //   }
  //   const data: ComparisonRequestResponseBody = {
  //     collectionId: results[0].collectionId,
  //     id: results[0].id,
  //     requestIp: results[0].requestIp,
  //     requestTime: results[0].requestTime,
  //     userId: results[0].userId,
  //   };
  //   return data;
  // });
// };
