import { Connection, mysqlQuery } from '@tjsr/mysql-pool-utils';

export const basicMySqlInsert = async (
  conn: Promise<Connection>,
  table: string,
  fields: string[],
  values: any
): Promise<void> => {
  const params: string[] = Array(fields.length).fill('?');
  const queryString = `insert into ${table} (${fields.join(', ')}) values (${params.join(
          ', '
        )})`;
  const queryParams = Object.keys(values).map((v) => values[v]);
  return mysqlQuery(queryString, queryParams, conn).then(() => {
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
