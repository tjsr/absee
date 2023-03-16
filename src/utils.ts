import { IPAddress, ISO8601Date, UserId } from "./types";

import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE = process.env.USERID_UUID_NAMESPACE || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const getUserId = (): UserId => {
  return uuidv5('1', USERID_UUID_NAMESPACE);
};

export const iso8601Now = (): ISO8601Date => {
  return (new Date()).toISOString();
};

