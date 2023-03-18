import { EmailAddress } from '../types';
import { UserModel } from '../types/model';
// import axios from "axios"
import mysql from 'mysql';
export type PoolConnection = mysql.PoolConnection;

const requireEnv = (val: string): string => {
  if (process.env[val] === undefined) {
    throw Error(`${val} environment variable not set, which is required.`);
  }
  return process.env[val] as string;
}

if (process.env.MYSQL_HOST === undefined) {
}
const config: mysql.PoolConfig = {
  connectionLimit: process.env.MYSQL_CONNECTION_POOL_SIZE !== undefined ? parseInt(process.env.MYSQL_CONNECTION_POOL_SIZE) : 5,
  host: requireEnv('MYSQL_HOST'),
  user: requireEnv('MYSQL_USER'),
  password: requireEnv('MYSQL_PASSWORD'),
  database: requireEnv('MYSQL_DATABASE')
}

const connectionPool = mysql.createPool(config);

export const getConnection = async (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

export const basicMySqlInsert = <Q extends any>(table: string, fields: string[], values: any): Promise<void> => {
  const params: string[] = Array(fields.length).fill("?");
  return new Promise((resolve, reject) => {
    getConnection().then((conn: PoolConnection) => {
      const sqlParams:any[] = [];
      conn.query(`insert into ${table} (${fields.join(', ')}) values (${params.join(', ')})`, Object.keys(values).map((v) => values[v]), (err) => {
        conn.release();
        if (err && err.sqlState === '23000') {
          resolve();
        } else if (err) {
          reject(err);
        }
        resolve();
      });
    }).catch((err) => reject(err));
  });
};

export const getDbUserByEmail = (email: EmailAddress): UserModel  => {
  return {
    userId: '1',
    email: 'x@y.com',
  }
};

// export const sqlinsert = <T>(table: string, postRequest: T):Promise<void> => {
//   return new Promise((resolve, reject) => {
//     connectionPool.getConnection((err, connection) => {
//       if (err) {
//         reject(err);
//       } else {
//         // do query
//         connection.createQuery(`INSERT INTO ${table} )
//         connection.release();
//       }
//     });
//   });
//   if (connection.connect())
//   return axios.post(`${SQLITE_HOST}/${table}`, postRequest, { headers: {
//     'Content-Type': 'application/json'
//   }})
// };

// export const sqlrequest = <T>(table: string, params: any): Promise<T> => {
//   const urlParams = new URLSearchParams(params).toString();
//   return axios.get(`${SQLITE_HOST}/${table}/?${urlParams}`, { headers: {
//     'Content-Type': 'application/json'
//   }});
// }