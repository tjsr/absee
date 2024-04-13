import { PoolConnection, getConnection } from './mysqlConnections.js';

export const basicMySqlInsert = async (
  table: string,
  fields: string[],
  values: any
): Promise<void> => {
  const params: string[] = Array(fields.length).fill('?');
  return new Promise((resolve, reject) => {
    getConnection()
      .then((conn: PoolConnection) => {
        conn.query(
          `insert into ${table} (${fields.join(', ')}) values (${params.join(
            ', '
          )})`,
          Object.keys(values).map((v) => values[v]),
          (err) => {
            conn.release();
            if (err && err.sqlState === '23000') {
              console.error('Failed inserting with primary key violation');
              reject(err);
            } else if (err) {
              console.error(`Error inserting into ${table}: ${err}`, err);
              reject(err);
            }
            resolve();
          }
        );
      })
      .catch((err) => reject(err));
  });
};
