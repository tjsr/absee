import { ISO8601Date, SnowflakeType, UserId, uuid } from "./types";

import { ABSeeRequest } from "./session";
import { getSnowflake } from "./snowflake";
import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE = process.env.USERID_UUID_NAMESPACE || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const createRandomUserId = (): uuid => {
  return uuidv5(getSnowflake().toString(), USERID_UUID_NAMESPACE);
}

export const getUserId = (request: ABSeeRequest): UserId => {
  // request.session.reload((err) => {
  //   if (err) {
  //     console.error('Error reloading session', err);
  //   } else {
  //     console.log('In session reload');
  //   }
  // });
  if (request.session && request.session.userId) {
    // console.log('Got a session for current call');
    return request.session.userId;
  } else if (!request.session) {
    throw new Error('No session');
  } else {
    request.session.userId = createRandomUserId();
    // console.log(`Created a new userId ${request.session.userId} for session id: ${request.session.id}`);
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