import axios from "axios"

const SQLITE_HOST = process.env.SQLITE_HOST || 'http://localhost:8085';

export const sqlinsert = <T>(table: string, postRequest: T):Promise<void> => {
  return axios.post(`${SQLITE_HOST}/${table}`, postRequest, { headers: {
    'Content-Type': 'application/json'
  }})
};