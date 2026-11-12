import { SnowflakeType } from "../types.ts";

export const snowflakeToSqlId = (snowflake: SnowflakeType): bigint => {
  return BigInt(snowflake);
};
