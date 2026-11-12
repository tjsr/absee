import { Connection, mysqlQuery } from '@tjsr/mysql-pool-utils';

import { QueryParamsTypes } from '../queryTypes.ts';

export const basicMySqlInsert = async (
  conn: Promise<Connection>,
  table: string,
  fields: string[],
  values: QueryParamsTypes[]
): Promise<void> => {
  const params: string[] = Array(fields.length).fill('?');
  const queryString = `insert into ${table} (${fields.join(', ')}) values (${params.join(
    ', '
  )})`;
  return mysqlQuery(queryString, values, conn).then(() => {
    return;
  }).catch((err) => {
    if (err && err.sqlState === '23000') {
      console.error('Failed inserting with primary key violation');
      throw err;
    } else if (err) {
      console.error(`Error inserting into ${table}: ${err}`, err);
      throw err;
    }
  });
};
