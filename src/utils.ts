import { ISO8601Date, UserId } from "./types";

import { ABSeeRequest } from "./session";
import { getSnowflake } from "./snowflake";
import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE = process.env.USERID_UUID_NAMESPACE || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const getUserId = (request: ABSeeRequest): UserId => {
  if (request.session && request.session.userId) {
    return request.session.userId;
  } else if (!request.session) {
    throw new Error('No session');
  } else {
    request.session.userId = uuidv5(getSnowflake().toString(), USERID_UUID_NAMESPACE)
    request.session.save();
    return request.session.userId;
  }
};

export const iso8601Now = (): ISO8601Date => {
  // return (new Date()).toISOString();
  return new Date();
};

const createdWeightedRandomizerList = (max: number): number[] => {
  let current = 1;
  let output: number[] = [];

  // do {
  //   output = [...output]
  // }
  return [];
};