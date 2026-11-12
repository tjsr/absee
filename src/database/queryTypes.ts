import { DatabaseConnection } from "../types.ts";

export type QueryParamsTypes = string|boolean|bigint|number|null;
export type QueryParamsArray = QueryParamsTypes[];
export type QueryResultType<R, P> = [R, P[]];

export type SqlQueryFunction<R, P>  = (
    sql: string, params: QueryParamsArray, conn: DatabaseConnection
  ) => Promise<QueryResultType<R, P>>
